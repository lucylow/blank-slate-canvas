"""
Explanation API Routes - Provides endpoints for Explainable AI explanations
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging

from app.services.explainable_ai_service import ExplainableAIService
from app.config import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/explanations", tags=["explanations"])

# Initialize service
explainable_ai = ExplainableAIService()


# Request/Response models
class ExplanationRequest(BaseModel):
    prediction_type: str
    model: Optional[Dict[str, Any]] = None
    features: Dict[str, float]
    prediction: float
    baseline_data: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


class ComparisonRequest(BaseModel):
    explanation_ids: List[str]
    comparison_type: Optional[str] = "feature_importance"


class BatchExplanationRequest(BaseModel):
    predictions: List[ExplanationRequest]


class ExplanationResponse(BaseModel):
    success: bool
    explanation: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    error: Optional[str] = None


class BatchExplanationResponse(BaseModel):
    success: bool
    batch_id: str
    results: List[Dict[str, Any]]
    summary: Dict[str, int]


class ComparisonResponse(BaseModel):
    success: bool
    comparison: Dict[str, Any]
    explanations_compared: int


@router.post("/explain", response_model=ExplanationResponse)
async def generate_explanation(request: ExplanationRequest):
    """
    Generate explanation for any prediction
    
    Args:
        request: Explanation request with prediction details
    
    Returns:
        Explanation response with top-3 evidence breakdown
    """
    try:
        if not request.prediction_type or not request.features or request.prediction is None:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: prediction_type, features, prediction"
            )
        
        # Generate explanation
        explanation = await explainable_ai.generate_explanation(
            prediction_type=request.prediction_type,
            model=request.model or {},
            features=request.features,
            prediction=request.prediction,
            baseline_data=request.baseline_data
        )
        
        # Store explanation for later retrieval
        request_id = request.request_id or explanation.get('explanation_id')
        await store_explanation(explanation, request_id)
        
        return ExplanationResponse(
            success=True,
            explanation=explanation,
            request_id=request_id
        )
        
    except Exception as error:
        logger.error(f'Error generating explanation: {error}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanation: {str(error)}"
        )


@router.get("/{explanation_id}")
async def get_explanation(explanation_id: str):
    """
    Get explanation by ID
    
    Args:
        explanation_id: Unique explanation identifier
    
    Returns:
        Stored explanation
    """
    try:
        explanation = await get_explanation_from_store(explanation_id)
        
        if not explanation:
            raise HTTPException(
                status_code=404,
                detail="Explanation not found"
            )
        
        return {"success": True, "explanation": explanation}
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'Error retrieving explanation: {error}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve explanation: {str(error)}"
        )


@router.post("/compare", response_model=ComparisonResponse)
async def compare_explanations(request: ComparisonRequest):
    """
    Compare multiple explanations
    
    Args:
        request: Comparison request with explanation IDs
    
    Returns:
        Comparison analysis
    """
    try:
        if not request.explanation_ids or not isinstance(request.explanation_ids, list):
            raise HTTPException(
                status_code=400,
                detail="explanation_ids array required"
            )
        
        # Retrieve all explanations
        explanations = await asyncio.gather(*[
            get_explanation_from_store(exp_id)
            for exp_id in request.explanation_ids
        ])
        
        valid_explanations = [exp for exp in explanations if exp is not None]
        
        if not valid_explanations:
            raise HTTPException(
                status_code=404,
                detail="No valid explanations found"
            )
        
        # Generate comparison
        comparison = generate_comparison(
            valid_explanations,
            request.comparison_type or "feature_importance"
        )
        
        return ComparisonResponse(
            success=True,
            comparison=comparison,
            explanations_compared=len(valid_explanations)
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'Error comparing explanations: {error}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare explanations: {str(error)}"
        )


@router.post("/batch-explain", response_model=BatchExplanationResponse)
async def batch_generate_explanations(request: BatchExplanationRequest):
    """
    Generate explanations for multiple predictions in batch
    
    Args:
        request: Batch explanation request
    
    Returns:
        Batch results with summary
    """
    try:
        if not request.predictions or not isinstance(request.predictions, list):
            raise HTTPException(
                status_code=400,
                detail="predictions array required"
            )
        
        import asyncio
        
        # Generate all explanations in parallel
        results = await asyncio.gather(*[
            generate_single_explanation(prediction, index)
            for index, prediction in enumerate(request.predictions)
        ], return_exceptions=True)
        
        # Process results
        processed_results = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "success": False,
                    "prediction_index": idx,
                    "error": str(result),
                    "request_id": request.predictions[idx].request_id
                })
            else:
                processed_results.append(result)
        
        successful = sum(1 for r in processed_results if r.get("success", False))
        
        return BatchExplanationResponse(
            success=True,
            batch_id=f"batch_{int(asyncio.get_event_loop().time() * 1000)}",
            results=processed_results,
            summary={
                "total": len(processed_results),
                "successful": successful,
                "failed": len(processed_results) - successful
            }
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'Error in batch explanation: {error}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate batch explanations: {str(error)}"
        )


# Helper functions
async def generate_single_explanation(prediction: ExplanationRequest, index: int):
    """Generate explanation for a single prediction"""
    try:
        explanation = await explainable_ai.generate_explanation(
            prediction_type=prediction.prediction_type,
            model=prediction.model or {},
            features=prediction.features,
            prediction=prediction.prediction,
            baseline_data=prediction.baseline_data
        )
        
        request_id = prediction.request_id or explanation.get('explanation_id')
        await store_explanation(explanation, request_id)
        
        return {
            "success": True,
            "prediction_index": index,
            "explanation": explanation,
            "request_id": request_id
        }
    except Exception as error:
        return {
            "success": False,
            "prediction_index": index,
            "error": str(error),
            "request_id": prediction.request_id
        }


async def store_explanation(explanation: Dict[str, Any], request_id: Optional[str] = None):
    """Store explanation in Redis"""
    try:
        storage_id = request_id or explanation.get('explanation_id')
        if not storage_id:
            return
        
        redis_client = await get_redis_client()
        if redis_client:
            import json
            await redis_client.hset(
                f"explanation:{storage_id}",
                mapping={
                    "data": json.dumps(explanation),
                    "created_at": explanation.get('generated_at', ''),
                    "prediction_type": explanation.get('prediction_type', '')
                }
            )
            await redis_client.expire(f"explanation:{storage_id}", 86400)  # 24 hours
    except Exception as error:
        logger.warning(f"Failed to store explanation in Redis: {error}")


async def get_explanation_from_store(explanation_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve explanation from Redis"""
    try:
        redis_client = await get_redis_client()
        if redis_client:
            import json
            data = await redis_client.hget(f"explanation:{explanation_id}", "data")
            if data:
                return json.loads(data)
        return None
    except Exception as error:
        logger.warning(f"Failed to retrieve explanation from Redis: {error}")
        return None


def generate_comparison(explanations: List[Dict[str, Any]], comparison_type: str) -> Dict[str, Any]:
    """Generate comparison between explanations"""
    common_features = find_common_features(explanations)
    
    comparison = {
        "type": comparison_type,
        "explanations_count": len(explanations),
        "common_features": common_features,
        "feature_analysis": {},
        "key_insights": []
    }
    
    # Analyze each common feature across explanations
    for feature in common_features:
        feature_analysis = analyze_feature_across_explanations(feature, explanations)
        comparison["feature_analysis"][feature] = feature_analysis
        
        if feature_analysis.get("consistency") == "low":
            comparison["key_insights"].append(
                f"Varying impact of {feature} across different predictions"
            )
    
    # Add overall insights
    overall_coverage = calculate_overall_coverage(explanations)
    comparison["key_insights"].append(
        f"Top 3 features explain {overall_coverage}% of predictions on average"
    )
    
    return comparison


def find_common_features(explanations: List[Dict[str, Any]]) -> List[str]:
    """Find common features across explanations"""
    feature_sets = [
        [f["feature"] for f in exp.get("top_evidence", [])]
        for exp in explanations
    ]
    
    # Get all unique features
    all_features = set()
    for features in feature_sets:
        all_features.update(features)
    
    # Return top 10 most common features
    return list(all_features)[:10]


def analyze_feature_across_explanations(
    feature: str,
    explanations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Analyze feature importance across multiple explanations"""
    feature_occurrences = 0
    total_importance = 0.0
    
    for exp in explanations:
        top_evidence = exp.get("top_evidence", [])
        for evidence in top_evidence:
            if evidence.get("feature") == feature:
                feature_occurrences += 1
                total_importance += evidence.get("importance", 0.0)
                break
    
    avg_importance = total_importance / feature_occurrences if feature_occurrences > 0 else 0.0
    
    return {
        "frequency": (feature_occurrences / len(explanations) * 100) if explanations else 0.0,
        "average_importance": avg_importance,
        "consistency": "high" if avg_importance > 0.1 else "medium" if avg_importance > 0.05 else "low"
    }


def calculate_overall_coverage(explanations: List[Dict[str, Any]]) -> int:
    """Calculate overall coverage percentage"""
    if not explanations:
        return 0
    
    total_coverage = sum(
        exp.get("confidence", {}).get("coverage", 0.0)
        for exp in explanations
    )
    
    avg_coverage = total_coverage / len(explanations)
    return int(avg_coverage * 100)


# Fix missing import
import asyncio


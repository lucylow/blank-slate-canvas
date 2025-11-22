# Hack the Track - Hackathon Requirements

## Project Goal
Develop a real-time analytics and strategy tool for the GR Cup Series to enhance driver insights, team performance, and race-day decision-making.

## Selected Category
**Real-Time Analytics** - Design a tool that simulates real-time decision-making for a race engineer. What's the perfect pit stop window? How can you react to a caution flag?

## Judging Criteria (Priority Order)

### 1. Application of the TRD Datasets (HIGHEST PRIORITY)
- Does the project apply the datasets in an effective way, fitting with the categories?
- Does the project showcase the datasets uniquely?

### 2. Design
- Is the user experience and design of the project well thought out?
- **Is there a balanced blend of frontend and backend in the software?** ← KEY REQUIREMENT

### 3. Potential Impact
- How big of an impact could the project have on the Toyota Racing community?
- How big of an impact could it have beyond the target community?

### 4. Quality of the Idea
- How creative and unique is the project?
- Does the concept exist already? If so, how much does the project improve on it?

## Submission Requirements
1. Category selected: **Real-Time Analytics**
2. Dataset(s) used: All 7 track datasets provided
3. Text Description
4. Published project for judges to test
5. URL to code repository (share with testing@devpost.com and trd.hackathon@toyota.com)
6. 3-minute demo video

## Key Technical Requirements for Real-Time Analytics

### Effective Applications
- **Live Gap Calculator**: Use lap distance + time to compute real-time position gaps
- **Tire Wear Simulator**: Combine lateral Gs + longitudinal Gs to model tire degradation in real-time
- **Pit Stop Optimizer**: Use sector times + predicted tire wear to recommend optimal pit windows

### Unique Showcase Opportunities
- **Multi-vehicle correlation**: Track how one car's brake patterns affect their speed
- **Predictive braking zones**: Use historical steering angle + brake data to predict optimal braking points

## Dataset Variables Available
- **Spatial/Temporal**: GPS data, lap distance, timestamps
- **Vehicle Dynamics**: Speed, Gear, RPM, lateral acceleration, longitudinal acceleration
- **Driver Inputs**: Steering angle, throttle position, brake pressure (front/rear)
- **Performance Mapping**: Sector times (S1.a, IM1a, S1.b, etc.), track maps, telemetry patterns

## GR Cup Series Context
- **Format**: Seven double-header race weekends, two ~45-minute sprint races each
- **Car**: Homologated Toyota GR86 (spec series - all cars identical)
- **Key Factor**: Strategy and driver skill are the decisive factors (not car performance)
- **Data Available**: Lap timing, race results, telemetry (speed, gear, throttle, brake), track sections

## Backend AI Features Required

### 1. Real-Time Analytics Engine
- Process live telemetry streams
- Calculate gaps, positions, sector times
- Monitor tire wear indicators

### 2. Predictive Tire Degradation Model
- ML model using acceleration data (lateral/longitudinal Gs)
- Predict tire wear percentage over laps
- 95% accuracy target (as stated in frontend)

### 3. Pit Stop Optimizer
- Calculate optimal pit windows based on tire wear
- Factor in race position, gaps to competitors
- Simulate different pit strategies

### 4. Performance Analyzer
- Compare driver inputs across sectors
- Identify improvement opportunities
- Benchmark against optimal racing lines

### 5. Strategy Simulator
- Simulate race scenarios (caution flags, weather changes)
- Calculate finish position predictions
- Optimize qualifying vs race strategies

### 6. Gap Analysis Engine
- Real-time competitor gap calculations
- Overtaking opportunity detection
- Position prediction

## Budget Constraint
- **Less than 300 Manus credits**
- Focus on making it work and meeting judging criteria
- This is a 5-day project, backend only for now
- Frontend and backend will be integrated later

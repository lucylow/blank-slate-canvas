import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import VideoPreview from '../components/VideoPreview';

describe('VideoPreview', () => {
  it('renders video element with given src', () => {
    const { container } = render(<VideoPreview src="/videos/overtake-turn3.mp4" />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('/videos/overtake-turn3.mp4');
  });

  it('renders video with poster attribute when provided', () => {
    const { container } = render(
      <VideoPreview 
        src="/videos/overtake-turn3.mp4" 
        poster="/videos/posters/overtake-turn3.jpg"
      />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('poster')).toBe('/videos/posters/overtake-turn3.jpg');
  });

  it('video has correct default attributes', () => {
    const { container } = render(<VideoPreview src="/videos/test.mp4" />);
    const video = container.querySelector('video');
    expect(video?.getAttribute('muted')).toBe('');
    expect(video?.getAttribute('playsinline')).toBe('');
    expect(video?.getAttribute('loop')).toBe('');
    expect(video?.getAttribute('preload')).toBe('metadata');
  });

  it('renders with custom aria label', () => {
    const { container } = render(
      <VideoPreview 
        src="/videos/test.mp4" 
        ariaLabel="Custom video preview"
      />
    );
    const wrapper = container.querySelector('.video-preview');
    expect(wrapper?.getAttribute('aria-label')).toBe('Custom video preview');
  });
});

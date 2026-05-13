import { clsx } from 'clsx';

export type VideoEmbedAspect = '16:9' | '4:3' | '1:1' | '21:9' | (string & {});

export type VideoEmbedProps = {
  src: string;
  /** Required for a11y — title of the embedded video. */
  title: string;
  /** Aspect ratio. Either a preset (`16:9`, `4:3`, `1:1`, `21:9`) or any Tailwind aspect-* class. */
  aspectRatio?: VideoEmbedAspect;
  /** Render with rounded corners. Default `true`. */
  rounded?: boolean;
  /** Embed type. `iframe` (default — YouTube, Vimeo, …) or `video` (native HTML5 file). */
  type?: 'iframe' | 'video';
  /** Pass-through to the underlying element (iframe `allow`, video `muted`/`autoPlay`/`loop`/`controls`/`poster`). */
  allow?: string;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  className?: string;
};

const ASPECT_PRESETS: Record<'16:9' | '4:3' | '1:1' | '21:9', string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

const resolveAspect = (a: VideoEmbedAspect): string => {
  if (a in ASPECT_PRESETS) return ASPECT_PRESETS[a as keyof typeof ASPECT_PRESETS];
  // assume the consumer passed a Tailwind class
  return a;
};

export const VideoEmbed = ({
  src,
  title,
  aspectRatio = '16:9',
  rounded = true,
  type = 'iframe',
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  muted,
  autoPlay,
  loop,
  controls = true,
  poster,
  className,
}: VideoEmbedProps) => (
  <div
    className={clsx(
      'w-full overflow-hidden bg-black',
      resolveAspect(aspectRatio),
      rounded && 'rounded-xl',
      className,
    )}
  >
    {type === 'iframe' ? (
      <iframe
        src={src}
        title={title}
        allow={allow}
        allowFullScreen
        loading="lazy"
        className="h-full w-full border-0"
      />
    ) : (
      <video
        src={src}
        title={title}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        controls={controls}
        playsInline
        poster={poster}
        className="h-full w-full"
      />
    )}
  </div>
);

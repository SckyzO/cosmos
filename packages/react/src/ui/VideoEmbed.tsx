import { clsx } from 'clsx';
import { Play } from 'lucide-react';
import { useState, type HTMLAttributeReferrerPolicy } from 'react';

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
  /**
   * iframe `sandbox` tokens. The default lets the usual players run (scripts, their own origin,
   * fullscreen presentation, popups) and nothing else: no top-level navigation, forms or
   * downloads. Pass `''` for the strictest sandbox. Only applies to `type="iframe"`.
   */
  sandbox?: string;
  /**
   * iframe `referrerpolicy`. The default sends the origin only, which YouTube and Vimeo need to
   * accept the embed. Only applies to `type="iframe"`.
   */
  referrerPolicy?: HTMLAttributeReferrerPolicy;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Poster image: the native video's `poster`, and the backdrop of the `facade`. */
  poster?: string;
  /**
   * Click-to-load: show the poster and a play button, and put the iframe in the page only once
   * the button is pressed, so the page loads no third-party player (and sets none of its
   * cookies) until the visitor asks for the video. The player then starts on its own. Default
   * `false`: the iframe is there from the start. Only applies to `type="iframe"`.
   */
  facade?: boolean;
  className?: string;
};

const ASPECT_PRESETS: Record<'16:9' | '4:3' | '1:1' | '21:9', string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

const DEFAULT_SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox';

const resolveAspect = (a: VideoEmbedAspect): string => {
  if (a in ASPECT_PRESETS) return ASPECT_PRESETS[a as keyof typeof ASPECT_PRESETS];
  // assume the consumer passed a Tailwind class
  return a;
};

// Ask the player to start: the visitor already pressed play, a second click would be noise.
// YouTube and Vimeo both read `autoplay=1`; an `src` that is not a URL is left as it is.
const withAutoplay = (src: string) => {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  url.searchParams.set('autoplay', '1');
  return url.toString();
};

// A module-level function, so React calls it once on mount and not on every render.
const focusOnMount = (el: HTMLIFrameElement | null) => el?.focus();

export const VideoEmbed = ({
  src,
  title,
  aspectRatio = '16:9',
  rounded = true,
  type = 'iframe',
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  sandbox = DEFAULT_SANDBOX,
  referrerPolicy = 'strict-origin-when-cross-origin',
  muted,
  autoPlay,
  loop,
  controls = true,
  poster,
  facade = false,
  className,
}: VideoEmbedProps) => {
  const [loaded, setLoaded] = useState(false);
  const showFacade = type === 'iframe' && facade && !loaded;
  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden bg-black',
        resolveAspect(aspectRatio),
        rounded && 'rounded-xl',
        className
      )}
    >
      {showFacade ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          aria-label={`Play ${title}`}
          className="group focus-visible:focus-indicator absolute inset-0 flex h-full w-full items-center justify-center focus-visible:ring-inset"
        >
          {poster && (
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform group-hover:scale-110">
            {/* The triangle points right in both directions, as the time of a video runs from the
                left: its optical offset is a physical one. */}
            <Play aria-hidden className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </button>
      ) : type === 'iframe' ? (
        <iframe
          // The button that held the focus is gone: hand the focus to the player it opened.
          ref={facade ? focusOnMount : undefined}
          src={facade ? withAutoplay(src) : src}
          title={title}
          allow={allow}
          sandbox={sandbox}
          referrerPolicy={referrerPolicy}
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
};

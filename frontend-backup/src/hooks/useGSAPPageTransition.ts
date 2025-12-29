// hooks/useGSAPPageTransition.ts
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface UseGSAPPageTransitionOptions {
  /** ╨Ф╨╗╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╤М ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╕ ╨┐╨╛╤П╨▓╨╗╨╡╨╜╨╕╤П ╨▓ ╤Б╨╡╨║╤Г╨╜╨┤╨░╤Е */
  duration?: number;
  /** Easing ╤Д╤Г╨╜╨║╤Ж╨╕╤П */
  ease?: string;
  /** ╨Ч╨░╨┤╨╡╤А╨╢╨║╨░ ╨┐╨╡╤А╨╡╨┤ ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╡╨╣ ╨▓ ╤Б╨╡╨║╤Г╨╜╨┤╨░╤Е */
  delay?: number;
  /** ╨Э╨░╤З╨░╨╗╤М╨╜╨░╤П ╨┐╤А╨╛╨╖╤А╨░╤З╨╜╨╛╤Б╤В╤М */
  fromOpacity?: number;
  /** ╨Ъ╨╛╨╜╨╡╤З╨╜╨░╤П ╨┐╤А╨╛╨╖╤А╨░╤З╨╜╨╛╤Б╤В╤М */
  toOpacity?: number;
  /** ╨Э╨░╤З╨░╨╗╤М╨╜╨╛╨╡ ╤Б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ Y */
  fromY?: number;
  /** ╨Ъ╨╛╨╜╨╡╤З╨╜╨╛╨╡ ╤Б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ Y */
  toY?: number;
  /** ╨Э╨░╤З╨░╨╗╤М╨╜╨╛╨╡ ╤Б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ X */
  fromX?: number;
  /** ╨Ъ╨╛╨╜╨╡╤З╨╜╨╛╨╡ ╤Б╨╝╨╡╤Й╨╡╨╜╨╕╨╡ ╨┐╨╛ X */
  toX?: number;
  /** ╨Э╨░╤З╨░╨╗╤М╨╜╤Л╨╣ scale */
  fromScale?: number;
  /** ╨Ъ╨╛╨╜╨╡╤З╨╜╤Л╨╣ scale */
  toScale?: number;
  /** ╨Т╨║╨╗╤О╤З╨╕╤В╤М ╨░╨╜╨╕╨╝╨░╤Ж╨╕╤О ╨┐╤А╨╕ ╨╝╨╛╨╜╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╕ */
  animateOnMount?: boolean;
}

/**
 * ╨е╤Г╨║ ╨┤╨╗╤П ╨┐╨╗╨░╨▓╨╜╤Л╤Е page transitions ╤Б ╨╕╤Б╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╨╜╨╕╨╡╨╝ GSAP
 * ╨Ч╨░╨╝╨╡╨╜╤П╨╡╤В Framer Motion ╨┤╨╗╤П ╨╗╤Г╤З╤И╨╡╨╣ ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨┤╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╨╕
 */
export function useGSAPPageTransition(
  elementRef: React.RefObject<HTMLElement>,
  options: UseGSAPPageTransitionOptions = {}
) {
  const {
    duration = 0.6,
    ease = 'power2.out',
    delay = 0,
    fromOpacity = 0,
    toOpacity = 1,
    fromY = 0,
    toY = 0,
    fromX = 0,
    toX = 0,
    fromScale = 1,
    toScale = 1,
    animateOnMount = true,
  } = options;

  const animationRef = useRef<gsap.core.Tween | null>(null);
  const hasAnimatedRef = useRef(false);
  const mountedRef = useRef(false);
  const interactionHandlersRef = useRef<Array<{ element: HTMLElement; handler: () => void; type: string }>>([]);

  useEffect(() => {
    // ╨Ч╨░╤Й╨╕╤В╨░ ╨╛╤В StrictMode: ╨╜╨╡ ╤Б╨▒╤А╨░╤Б╤Л╨▓╨░╨╡╨╝ hasAnimatedRef ╨┐╤А╨╕ cleanup
    if (mountedRef.current) {
      return;
    }
    
    mountedRef.current = true;
    
    if (!elementRef.current || !animateOnMount) {
      return;
    }

    if (hasAnimatedRef.current) {
      return;
    }

    const element = elementRef.current;
    
    // ╨Ц╨┤╨╡╨╝ ╤Б╨╗╨╡╨┤╤Г╤О╤Й╨╡╨│╨╛ ╤Д╤А╨╡╨╣╨╝╨░, ╤З╤В╨╛╨▒╤Л ╤Н╨╗╨╡╨╝╨╡╨╜╤В ╨▒╤Л╨╗ ╨┐╨╛╨╗╨╜╨╛╤Б╤В╤М╤О ╨╛╤В╤А╨╡╨╜╨┤╨╡╤А╨╡╨╜
    const rafId = requestAnimationFrame(() => {
      if (!elementRef.current || hasAnimatedRef.current) {
        return;
      }

      hasAnimatedRef.current = true;

      // ╨г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╨╝ ╨╜╨░╤З╨░╨╗╤М╨╜╨╛╨╡ ╤Б╨╛╤Б╤В╨╛╤П╨╜╨╕╨╡ ╨С╨Х╨Ч ╨╖╨░╨┤╨╡╤А╨╢╨║╨╕
      const fromProps: gsap.TweenVars = {
        opacity: fromOpacity,
        force3D: true,
        immediateRender: true, // ╨Я╤А╨╕╨╝╨╡╨╜╤П╨╡╨╝ ╤Б╤А╨░╨╖╤Г ╨┤╨╗╤П ╨╝╨│╨╜╨╛╨▓╨╡╨╜╨╜╨╛╨│╨╛ ╤Б╤В╨░╤А╤В╨░
      };
      
      if (fromY !== toY) fromProps.y = fromY;
      if (fromX !== toX) fromProps.x = fromX;
      if (fromScale !== toScale) fromProps.scale = fromScale;
      
      gsap.set(element, fromProps);

      // ╨Р╨╜╨╕╨╝╨░╤Ж╨╕╤П ╨┐╨╛╤П╨▓╨╗╨╡╨╜╨╕╤П - ╨▒╤Л╤Б╤В╤А╨░╤П ╨╕ ╨┐╤А╨╡╤А╤Л╨▓╨░╨╡╨╝╨░╤П
      const toProps: gsap.TweenVars = {
        opacity: toOpacity,
        duration,
        delay,
        ease,
        force3D: true,
        // ╨Т╨░╨╢╨╜╨╛: ╨╜╨╡ ╨▒╨╗╨╛╨║╨╕╤А╤Г╨╡╨╝ pointer events
        pointerEvents: 'auto',
        onInterrupt: () => {
          // ╨Я╤А╨╕ ╨┐╤А╨╡╤А╤Л╨▓╨░╨╜╨╕╨╕ ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╨╝ ╨║ ╤Д╨╕╨╜╨░╨╗╤М╨╜╨╛╨╣ ╨┐╨╛╨╖╨╕╤Ж╨╕╨╕ ╨╕ ╨╛╤З╨╕╤Й╨░╨╡╨╝ transform
          if (element) {
            // ╨б╨╡╨╗╨╡╨║╤В╨╕╨▓╨╜╨░╤П ╨╛╤З╨╕╤Б╤В╨║╨░ ╤В╨╛╨╗╤М╨║╨╛ ╨╜╤Г╨╢╨╜╤Л╤Е ╤Б╨▓╨╛╨╣╤Б╤В╨▓, ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╨║╨╛╨╜╤Д╨╗╨╕╨║╤В╨╛╨▓╨░╤В╤М ╤Б ╨╢╨╡╤Б╤В╨░╨╝╨╕
            gsap.set(element, {
              clearProps: 'transform,opacity',
            });
            element.style.opacity = String(toOpacity);
            element.style.transform = '';
            element.style.pointerEvents = '';
          }
        },
        onComplete: () => {
          // ╨Я╨╛╤Б╨╗╨╡ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╨╕╤П ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╕ ╤Д╨╕╨║╤Б╨╕╤А╤Г╨╡╨╝ ╤Д╨╕╨╜╨░╨╗╤М╨╜╤Г╤О ╨┐╨╛╨╖╨╕╤Ж╨╕╤О ╨╕ ╨╛╤З╨╕╤Й╨░╨╡╨╝ transform
          if (element) {
            // ╨б╨╡╨╗╨╡╨║╤В╨╕╨▓╨╜╨░╤П ╨╛╤З╨╕╤Б╤В╨║╨░ ╤В╨╛╨╗╤М╨║╨╛ ╨╜╤Г╨╢╨╜╤Л╤Е ╤Б╨▓╨╛╨╣╤Б╤В╨▓, ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╨║╨╛╨╜╤Д╨╗╨╕╨║╤В╨╛╨▓╨░╤В╤М ╤Б ╨╢╨╡╤Б╤В╨░╨╝╨╕
            gsap.set(element, {
              clearProps: 'transform,opacity',
            });
            // ╨г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╨╝ ╤Д╨╕╨╜╨░╨╗╤М╨╜╤Л╨╡ ╨╖╨╜╨░╤З╨╡╨╜╨╕╤П ╤З╨╡╤А╨╡╨╖ CSS
            element.style.opacity = String(toOpacity);
            element.style.transform = '';
            // ╨г╨▒╨╡╨╢╨┤╨░╨╡╨╝╤Б╤П, ╤З╤В╨╛ pointer-events ╤А╨░╨▒╨╛╤В╨░╤О╤В
            element.style.pointerEvents = '';
          }
          animationRef.current = null;
        },
      };
      
      if (fromY !== toY) toProps.y = toY;
      if (fromX !== toX) toProps.x = toX;
      if (fromScale !== toScale) toProps.scale = toScale;

      animationRef.current = gsap.to(element, toProps);
      
      // ╨Ф╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╨╛╨▒╤А╨░╨▒╨╛╤В╤З╨╕╨║ ╨┤╨╗╤П ╨┐╤А╨╡╤А╤Л╨▓╨░╨╜╨╕╤П ╨┐╤А╨╕ ╨╜╨░╤З╨░╨╗╨╡ ╨╢╨╡╤Б╤В╨░
      const handleInteraction = () => {
        if (animationRef.current && animationRef.current.isActive()) {
          // ╨Я╤А╨╡╤А╤Л╨▓╨░╨╡╨╝ ╨░╨╜╨╕╨╝╨░╤Ж╨╕╤О ╨╕ ╤Б╤А╨░╨╖╤Г ╤Г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╨╝ ╤Д╨╕╨╜╨░╨╗╤М╨╜╤Г╤О ╨┐╨╛╨╖╨╕╤Ж╨╕╤О
          animationRef.current.kill();
          if (element) {
            // ╨б╨╡╨╗╨╡╨║╤В╨╕╨▓╨╜╨░╤П ╨╛╤З╨╕╤Б╤В╨║╨░ ╤В╨╛╨╗╤М╨║╨╛ ╨╜╤Г╨╢╨╜╤Л╤Е ╤Б╨▓╨╛╨╣╤Б╤В╨▓, ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╨║╨╛╨╜╤Д╨╗╨╕╨║╤В╨╛╨▓╨░╤В╤М ╤Б ╨╢╨╡╤Б╤В╨░╨╝╨╕
            gsap.set(element, {
              clearProps: 'transform,opacity',
            });
            // ╨г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╨╝ ╤Д╨╕╨╜╨░╨╗╤М╨╜╤Л╨╡ ╨╖╨╜╨░╤З╨╡╨╜╨╕╤П
            element.style.opacity = String(toOpacity);
            element.style.transform = '';
            element.style.pointerEvents = '';
          }
          animationRef.current = null;
        }
      };
      
      // ╨б╨╗╤Г╤И╨░╨╡╨╝ ╤Б╨╛╨▒╤Л╤В╨╕╤П ╨▓╨╖╨░╨╕╨╝╨╛╨┤╨╡╨╣╤Б╤В╨▓╨╕╤П ╨┤╨╗╤П ╨┐╤А╨╡╤А╤Л╨▓╨░╨╜╨╕╤П ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╕
      element.addEventListener('pointerdown', handleInteraction, { once: true, passive: true });
      element.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
      
      // ╨б╨╛╤Е╤А╨░╨╜╤П╨╡╨╝ ╨╛╨▒╤А╨░╨▒╨╛╤В╤З╨╕╨║╨╕ ╨┤╨╗╤П cleanup (╤Е╨╛╤В╤П once: true ╨╛╨╖╨╜╨░╤З╨░╨╡╤В ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╤З╨╡╤Б╨║╨╛╨╡ ╤Г╨┤╨░╨╗╨╡╨╜╨╕╨╡)
      interactionHandlersRef.current.push(
        { element, handler: handleInteraction, type: 'pointerdown' },
        { element, handler: handleInteraction, type: 'touchstart' }
      );
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      // ╨г╨┤╨░╨╗╤П╨╡╨╝ ╨╛╨▒╤А╨░╨▒╨╛╤В╤З╨╕╨║╨╕ ╨▓╨╖╨░╨╕╨╝╨╛╨┤╨╡╨╣╤Б╤В╨▓╨╕╤П (╤Е╨╛╤В╤П once: true ╤Г╨╢╨╡ ╤Г╨┤╨░╨╗╨╕╨╗ ╨╕╤Е)
      interactionHandlersRef.current.forEach(({ element: el, handler, type }) => {
        el.removeEventListener(type, handler);
      });
      interactionHandlersRef.current = [];
      
      // ╨г╨▒╨╡╨╢╨┤╨░╨╡╨╝╤Б╤П, ╤З╤В╨╛ ╤Н╨╗╨╡╨╝╨╡╨╜╤В ╨▓ ╤Д╨╕╨╜╨░╨╗╤М╨╜╨╛╨╣ ╨┐╨╛╨╖╨╕╤Ж╨╕╨╕ ╨┐╤А╨╕ cleanup
      if (elementRef.current) {
        const el = elementRef.current;
        // ╨б╨╡╨╗╨╡╨║╤В╨╕╨▓╨╜╨░╤П ╨╛╤З╨╕╤Б╤В╨║╨░ ╤В╨╛╨╗╤М╨║╨╛ ╨╜╤Г╨╢╨╜╤Л╤Е ╤Б╨▓╨╛╨╣╤Б╤В╨▓, ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╨║╨╛╨╜╤Д╨╗╨╕╨║╤В╨╛╨▓╨░╤В╤М ╤Б ╨╢╨╡╤Б╤В╨░╨╝╨╕
        gsap.set(el, {
          clearProps: 'transform,opacity',
        });
        // ╨г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╨╝ ╤Д╨╕╨╜╨░╨╗╤М╨╜╤Л╨╡ ╨╖╨╜╨░╤З╨╡╨╜╨╕╤П
        el.style.opacity = String(toOpacity);
        el.style.transform = '';
        el.style.pointerEvents = '';
      }
      // ╨Э╨Х ╤Б╨▒╤А╨░╤Б╤Л╨▓╨░╨╡╨╝ hasAnimatedRef ╨╖╨┤╨╡╤Б╤М - ╤Н╤В╨╛ ╨╖╨░╤Й╨╕╤В╨░ ╨╛╤В StrictMode
      // mountedRef.current = false; // ╨в╨╛╨╢╨╡ ╨╜╨╡ ╤Б╨▒╤А╨░╤Б╤Л╨▓╨░╨╡╨╝, ╤З╤В╨╛╨▒╤Л ╨╕╨╖╨▒╨╡╨╢╨░╤В╤М ╨┐╨╛╨▓╤В╨╛╤А╨╜╨╛╨╣ ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╕
    };
  }, [elementRef, duration, ease, delay, fromOpacity, toOpacity, fromY, toY, fromX, toX, fromScale, toScale, animateOnMount]);

  // ╨д╤Г╨╜╨║╤Ж╨╕╤П ╨┤╨╗╤П exit ╨░╨╜╨╕╨╝╨░╤Ж╨╕╨╕ (╨╝╨╛╨╢╨╜╨╛ ╨▓╤Л╨╖╨▓╨░╤В╤М ╨┐╨╡╤А╨╡╨┤ unmount)
  const exit = (onComplete?: () => void) => {
    if (!elementRef.current) {
      onComplete?.();
      return;
    }

    if (animationRef.current) {
      animationRef.current.kill();
    }

    const exitProps: gsap.TweenVars = {
      opacity: fromOpacity,
      duration: duration * 0.8, // Exit ╨▒╤Л╤Б╤В╤А╨╡╨╡ ╤З╨╡╨╝ enter
      ease: 'power2.in',
      force3D: true,
      onComplete: () => {
        onComplete?.();
      },
    };
    
    if (fromY !== toY) exitProps.y = fromY;
    if (fromX !== toX) exitProps.x = fromX;
    if (fromScale !== toScale) exitProps.scale = fromScale;

    animationRef.current = gsap.to(elementRef.current, exitProps);
  };

  return { exit };
}


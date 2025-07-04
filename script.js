document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const appContainer = document.getElementById('app-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const staticFrameImage = document.getElementById('static-frame-image');
    const overlayImageLayer = document.getElementById('overlay-image-layer');
    const lajasOverlayImage = document.getElementById('lajas-overlay-image'); // Asumo que existe, aunque no se usaba
    const menuVideoElement = document.getElementById('menu-video-element');
    const transitionVideoElement = document.getElementById('transition-video-element');
    const slideVideoBuffer1 = document.getElementById('slide-video-buffer-1');
    const slideVideoBuffer2 = document.getElementById('slide-video-buffer-2');
    let currentSlideVideoElement = slideVideoBuffer1;
    let nextSlideVideoElement = slideVideoBuffer2;
    const introVideoElement = document.getElementById('intro-video-element');
    const menuVideoLayer = document.getElementById('menu-video-layer');
    const transitionVideoLayer = document.getElementById('transition-video-layer');
    const slideVideoLayer = document.getElementById('slide-video-layer');
    const introVideoLayer = document.getElementById('intro-video-layer');
    const introLayer = document.getElementById('intro-layer');
    const introContentWrapper = document.getElementById('intro-content-wrapper');
    const introDisclaimer = document.getElementById('intro-disclaimer');
    const startExperienceButton = document.getElementById('start-experience-button');
    const uiOverlayLayer = document.getElementById('ui-overlay-layer');
    const menuButtonsArea = document.getElementById('menu-buttons-area');
    const allMenuButtons = document.querySelectorAll('.menu-button');
    const slideBackToMenuButton = document.getElementById('slide-back-to-menu-button');
    const menuBackToIntroButton = document.getElementById('menu-back-to-intro-button');
    const slideInteractiveElements = document.getElementById('slide-interactive-elements');
    const allSlideNextButtons = document.querySelectorAll('.slide-next-button');
    const allSlidePrevButtons = document.querySelectorAll('.slide-prev-button');
    const menuInfoButton = document.getElementById('menu-info-button');
    const menuInfoTextBlock = document.getElementById('menu-info-text-block');
    const slide5ControlButtons = document.querySelectorAll('.slide5-control-button');
    const slide5OverlayImages = document.querySelectorAll('.slide5-overlay-image');
    const slide5BaseImage = document.getElementById('slide5-base-image');
    const slide5ControlButtonsContainer = document.querySelector('.slide5-image-controls');
    const toggleChristmasLightButton = document.getElementById('toggle-christmas-light-button');
    const slide2ControlsContainer = document.querySelector('.slide2-controls-container');
    const speechBubble = document.getElementById('speech-bubble');
    const creditsImage = document.getElementById('credits-image');
    
    // --- Variables de Estado ---
    let currentSceneVideoElement = introVideoElement;
    let currentUiLayer = introLayer;
    let pendingAction = null;
    let isTransitioning = false;
    let activeCircleButton = null;
    let activeTextBlock = null;
    let currentSlideId = null;
    let targetSceneAfterTransition = null;
    let activeSlide5ControlButton = null;
    let isChristmasNightMode = false;
    let nextActionAfterNightToDay = null;

    const FADE_DELAY = 30;
    const INTRO_TO_MENU_TRANSITION_VIDEO = "videos/intro-to-menu-transition.mp4";
    const MENU_TO_INTRO_TRANSITION_VIDEO = "videos/menu-to-intro-transition.mp4";
    const SLIDE2_DAY_VIDEO = "videos/slide2-animation.mp4";
    const SLIDE2_NIGHT_VIDEO = "videos/night-animation.mp4";
    const SLIDE2_TO_NIGHT_TRANSITION = "videos/slide2-to-night-transition.mp4";
    const NIGHT_TO_SLIDE2_TRANSITION = "videos/night-to-slide2-transition.mp4";

    // === INICIO DE CAMBIOS: SISTEMA DE PRECARGA TOTAL ===
    
    const preloadedVideos = new Map();

    function preloadVideo(src) {
        if (!src || preloadedVideos.has(src)) {
            return preloadedVideos.get(src) || Promise.resolve();
        }

        const promise = new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = src;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.addEventListener('canplaythrough', () => resolve(video), { once: true });
            video.addEventListener('error', (e) => {
                console.warn(`No se pudo precargar el video: ${src}`, e);
                // No rechazamos la promesa principal para no detener la carga completa,
                // pero sí la promesa individual para que el `catch` funcione.
                reject(e); 
            }, { once: true });
            video.load();
        });

        preloadedVideos.set(src, promise);
        return promise;
    }

    async function preloadAllAssets() {
        const videoSrcSet = new Set();
        
        // Recolectar todas las URLs de video del DOM
        document.querySelectorAll('video').forEach(v => {
            const source = v.querySelector('source');
            // Usamos la propiedad `src` del elemento, que resuelve la URL completa
            if (source && source.src) videoSrcSet.add(source.getAttribute('src'));
        });
        document.querySelectorAll('[data-animation], [data-entry-transition], [data-exit-transition], [data-next-animation], [data-prev-animation], [data-transition-video]').forEach(el => {
            Object.keys(el.dataset).forEach(key => {
                if (el.dataset[key] && el.dataset[key].endsWith('.mp4')) {
                    videoSrcSet.add(el.dataset[key]);
                }
            });
        });
        // Añadir videos hardcodeados
        [SLIDE2_NIGHT_VIDEO, SLIDE2_TO_NIGHT_TRANSITION, NIGHT_TO_SLIDE2_TRANSITION, INTRO_TO_MENU_TRANSITION_VIDEO, MENU_TO_INTRO_TRANSITION_VIDEO].forEach(src => videoSrcSet.add(src));

        const allVideoUrls = Array.from(videoSrcSet).filter(Boolean); // Filtra nulos o strings vacíos
        let loadedCount = 0;
        const totalCount = allVideoUrls.length;

        if (totalCount === 0) {
            if(progressText) progressText.textContent = "No se encontraron videos para cargar.";
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const promises = allVideoUrls.map(url =>
            preloadVideo(url)
                .catch(e => e) // No dejar que un error detenga a los demás
                .then(() => {
                    loadedCount++;
                    const percentage = Math.round((loadedCount / totalCount) * 100);
                    if (progressBar) progressBar.style.width = `${percentage}%`;
                    if (progressText) progressText.textContent = `${percentage}%`;
                })
        );

        await Promise.all(promises);

        // Pequeña pausa para que el usuario vea el 100%
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }, 300);
    }
    
    // === FIN DE CAMBIOS: SISTEMA DE PRECARGA TOTAL ===


    // === INICIO DE CAMBIOS: LÓGICA DE MÓVILES Y PANTALLA COMPLETA (MODIFICADA) ===
    
    const mobilePrompt = document.getElementById('mobile-fullscreen-prompt');
    const enterFullscreenButton = document.getElementById('enter-fullscreen-button');
    let appInitialized = false;

    function scaleAndCenterApp() {
        const targetWidth = 1600;
        const targetHeight = 900;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
        if (appContainer) {
            appContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    async function requestFullscreenAndLockOrientation() {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                await document.documentElement.webkitRequestFullscreen();
            }
            // Añadir otros prefijos si es necesario
            
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
            }
        } catch (err) {
            console.error(`Error al intentar entrar en pantalla completa o bloquear orientación: ${err.message}`);
        }
    }

    if (enterFullscreenButton) {
        enterFullscreenButton.addEventListener('click', requestFullscreenAndLockOrientation);
    }
    
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        if (isFullscreen) {
            if (mobilePrompt) mobilePrompt.style.display = 'none';
            if (!appInitialized) {
                // Si entramos en pantalla completa (en móvil), AHORA sí mostramos el loader y cargamos todo
                preloadAllAssets().then(() => {
                     startExperience();
                     appInitialized = true;
                });
            }
        } else {
             // Si el usuario sale de pantalla completa, volvemos a mostrar el prompt
            if (mobilePrompt && window.innerWidth < 1025) mobilePrompt.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
        }
    });
    
    // === FIN DE CAMBIOS: LÓGICA MÓVIL ===


    // --- Funciones de Video y Transición ---
    async function playVideo(videoElement, loop = false) {
        if (videoElement) {
            if (videoElement.loop === true && loop === true && !videoElement.paused && videoElement.currentTime > 0) {
                return;
            }
            if (!loop || videoElement.paused || videoElement.ended || videoElement.currentTime === 0) {
                 videoElement.currentTime = 0;
            }
            videoElement.loop = loop;
            try {
                await videoElement.play();
            }
            catch (error) { console.error(`[playVideo] Error para ${videoElement.id}:`, error, videoElement.currentSrc); }
        }
    }

    function hideAllSlide5DetailImages() {
        slide5OverlayImages.forEach(img => {
            if (img.id !== 'slide5-base-image') {
                img.classList.remove('visible');
            }
        });
        if (activeSlide5ControlButton) {
            activeSlide5ControlButton.classList.remove('active');
            activeSlide5ControlButton = null;
        }
    }

    function pauseVideo(videoElement) {
        if (videoElement && !videoElement.paused) {
            videoElement.pause();
        }
    }

    async function prepareVideoElement(videoEl, src) {
        // Esta función ahora es mucho más simple. Asumimos que el video está en caché.
        return new Promise((resolve, reject) => {
            if (!videoEl) { reject(new Error(`prepareVideoElement: videoEl es null`)); return; }
            if (!src) { resolve(); return; }

            let sourceTag = videoEl.querySelector('source');
            if (!sourceTag) {
                sourceTag = document.createElement('source');
                sourceTag.type = 'video/mp4';
                videoEl.appendChild(sourceTag);
            }
            
            // Comprobar si la fuente necesita ser actualizada
            const currentFullSrc = videoEl.currentSrc;
            const newFullSrc = new URL(src, document.baseURI).href;

            if (currentFullSrc !== newFullSrc) {
                sourceTag.setAttribute('src', src);
                videoEl.load();
            }
            // Ya no es necesario `ensureVideoCanPlay` porque todo está precargado
            resolve();
        });
    }

    async function onVideoEnded() {
        const endedVideo = this;

        if (!pendingAction) {
            if (!endedVideo.loop && endedVideo === currentSceneVideoElement && !isTransitioning) {
                 endedVideo.loop = true;
                 playVideo(endedVideo, true);
            }
            return;
        }

        const actionToExecute = pendingAction;
        pendingAction = null;

        try {
            if (endedVideo === transitionVideoElement) {
                if (actionToExecute.type === 'PLAY_SLIDE2_DAY_VIDEO' && nextActionAfterNightToDay) {
                    const originalAction = nextActionAfterNightToDay;
                    nextActionAfterNightToDay = null; 
                    isChristmasNightMode = false;
                    
                    transitionToState(originalAction);
                    return; 
                }
                
                setTimeout(() => {
                    transitionVideoLayer.classList.remove('active');
                    transitionVideoElement.classList.remove('visible');
                    pauseVideo(transitionVideoElement);
                }, FADE_DELAY);

                let finalScenePromise;

                if (actionToExecute.type === 'PLAY_SLIDE_AFTER_ENTRY_TRANSITION' && targetSceneAfterTransition) {
                    finalScenePromise = prepareAndShowTargetSlide(targetSceneAfterTransition.slideId, targetSceneAfterTransition.slideAnimation, true);
                }
                else if (actionToExecute.type === 'PLAY_SLIDE2_NIGHT_VIDEO') {
                    slideVideoLayer.classList.add('active');
                    await prepareVideoElement(currentSlideVideoElement, SLIDE2_NIGHT_VIDEO);
                    nextSlideVideoElement.classList.remove('visible');
                    currentSlideVideoElement.classList.add('visible');
                    currentSceneVideoElement = currentSlideVideoElement;
                    await playVideo(currentSceneVideoElement, true);
                    isChristmasNightMode = true;
                    toggleChristmasLightButton.textContent = "Apagar la Navidad";
                    setControlsWaitingState(false);
                    
                    const slide2Content = document.querySelector('.slide-specific-content[data-content-for-slide="slide2"]');
                    if (slide2Content) {
                        const titleContainer = slide2Content.querySelector('.slide-title-container');
                        if (titleContainer) {
                            titleContainer.classList.add('visible');
                        }
                    }
                    finalScenePromise = Promise.resolve();

                } else if (actionToExecute.type === 'PLAY_SLIDE2_DAY_VIDEO') {
                    slideVideoLayer.classList.add('active');
                    await prepareVideoElement(currentSlideVideoElement, SLIDE2_DAY_VIDEO);
                    nextSlideVideoElement.classList.remove('visible');
                    currentSlideVideoElement.classList.add('visible');
                    currentSceneVideoElement = currentSlideVideoElement;
                    await playVideo(currentSceneVideoElement, true);
                    isChristmasNightMode = false;
                    toggleChristmasLightButton.textContent = "Encender la Navidad";
                    setControlsWaitingState(false);

                    const slide2Content = document.querySelector('.slide-specific-content[data-content-for-slide="slide2"]');
                    if (slide2Content) {
                        const titleContainer = slide2Content.querySelector('.slide-title-container');
                        if (titleContainer) {
                            titleContainer.classList.add('visible');
                        }
                    }
                    finalScenePromise = Promise.resolve();
                    
                }
                else if (actionToExecute.type === 'PLAY_SLIDE_AFTER_SLIDE_TRANSITION' && targetSceneAfterTransition) {
                    finalScenePromise = prepareAndShowTargetSlide(targetSceneAfterTransition.slideId, targetSceneAfterTransition.slideAnimation, true);
                } else if (actionToExecute.type === 'SHOW_MENU_AFTER_EXIT_TRANSITION') {
                    finalScenePromise = Promise.resolve(actuallyShowMenuUi(true));
                } else if (actionToExecute.type === 'PLAY_MENU_AFTER_INTRO_TRANSITION') {
                    finalScenePromise = Promise.resolve(actuallyShowMenuUi(true));
                } else if (actionToExecute.type === 'PLAY_INTRO_AFTER_MENU_TRANSITION') {
                    finalScenePromise = Promise.resolve(actuallyShowIntroUi(true));
                } else {
                    setControlsWaitingState(false);
                    finalScenePromise = Promise.resolve();
                }
                await finalScenePromise;
                targetSceneAfterTransition = null;
            } else if ((endedVideo === slideVideoBuffer1 || endedVideo === slideVideoBuffer2) && actionToExecute.type === 'SLIDE_TO_SLIDE_NO_TRANSITION_BUFFER_SWAP') {
                await swapAndPlayNextSlideVideo(actionToExecute);
            } else {
                 setControlsWaitingState(false);
                 await executeStandardPendingAction(actionToExecute);
            }
        } catch (error) {
            console.error(`[onVideoEnded] Error during action execution after video end:`, error);
            setControlsWaitingState(false);
        }
    }

    async function swapAndPlayNextSlideVideo(action) {
        const oldSlideVideo = currentSlideVideoElement;
        const newSlideVideo = nextSlideVideoElement;
        slideVideoLayer.classList.add('active');
        newSlideVideo.classList.add('visible');
        newSlideVideo.loop = true;
        currentSceneVideoElement = newSlideVideo;
        await playVideo(currentSceneVideoElement, true);
        setTimeout(() => {
            oldSlideVideo.classList.remove('visible');
            oldSlideVideo.loop = false;
            pauseVideo(oldSlideVideo);
        }, FADE_DELAY);
        currentSlideVideoElement = newSlideVideo;
        nextSlideVideoElement = oldSlideVideo;
        actuallyShowSlideUi(action.slideId, false);
        setControlsWaitingState(false);
    }

    async function executeStandardPendingAction(action) {
        let videoToPrepare = null;
        let loopVideo = false;
        if (action.type === 'SLIDE_TO_MENU_NO_TRANSITION') {
            videoToPrepare = menuVideoElement;
            loopVideo = true;
        } else if (action.type === 'MENU_TO_SLIDE_NO_TRANSITION') {
            videoToPrepare = currentSlideVideoElement;
            loopVideo = true;
             try {
                await prepareVideoElement(videoToPrepare, action.slideAnimation);
            } catch (error) {
                setControlsWaitingState(false);
                return;
            }
        }
        if (videoToPrepare) {
            try {
                [menuVideoLayer, slideVideoLayer, transitionVideoLayer, introVideoLayer].forEach(layer => {
                    if (videoToPrepare.closest('.video-layer') !== layer) {
                         layer.classList.remove('active');
                         layer.querySelectorAll('video').forEach(vid => pauseVideo(vid));
                    }
                });
                 const targetLayer = videoToPrepare.closest('.video-layer');
                 if(targetLayer) targetLayer.classList.add('active');
                if (videoToPrepare === slideVideoBuffer1) {
                    slideVideoBuffer2.classList.remove('visible');
                } else if (videoToPrepare === slideVideoBuffer2) {
                    slideVideoBuffer1.classList.remove('visible');
                } else {
                    videoToPrepare.classList.add('visible');
                }
                currentSceneVideoElement = videoToPrepare;
                await playVideo(currentSceneVideoElement, loopVideo);
            } catch(e) {
                console.error(`Error en executeStandardPendingAction (${action.type}):`, e);
            }
        }
        if (action.type === 'SLIDE_TO_MENU_NO_TRANSITION') actuallyShowMenuUi(false);
        else if (action.type === 'MENU_TO_SLIDE_NO_TRANSITION') actuallyShowSlideUi(action.slideId, true);
        setControlsWaitingState(false);
    }


    async function prepareAndShowTargetSlide(slideId, slideAnimation, comingFromTransitionVideo = true) {
        try {
            slideVideoLayer.classList.add('active');
            let targetBufferForNextSlide = currentSlideVideoElement;
            await prepareVideoElement(targetBufferForNextSlide, slideAnimation);
            actuallyShowSlideUi(slideId, true);
        } catch (error) {
            console.error(`Error preparando el slide target: ${slideId}`, error);
            setControlsWaitingState(false);
        }
    }

    function setControlsWaitingState(waiting) {
        isTransitioning = waiting;
        const mainControls = [
            startExperienceButton,
            menuInfoButton,
            menuBackToIntroButton,
            slideBackToMenuButton,
            ...allMenuButtons,
            ...allSlideNextButtons,
            ...allSlidePrevButtons,
            toggleChristmasLightButton
        ];

        const action = waiting ? 'add' : 'remove';
        mainControls.forEach(btn => btn && btn.classList[action]('waiting'));

        if (currentSlideId) {
            const activeSlideContent = document.querySelector(`.slide-specific-content[data-content-for-slide="${currentSlideId}"].active`);
            if (activeSlideContent) {
                activeSlideContent.querySelectorAll('.circle-button').forEach(btn => btn && btn.classList[action]('waiting'));
            }
        }
    }

    function closeMenuInfoPanel() {
        if (menuInfoTextBlock.classList.contains('visible')) {
            menuInfoTextBlock.classList.remove('visible');
            menuInfoButton.classList.remove('active');
        }
    }

    async function transitionToState(action) {
        if (currentSlideId) {
            const oldSlideContent = document.querySelector(`.slide-specific-content[data-content-for-slide="${currentSlideId}"].active`);
            if (oldSlideContent) {
                const titleContainer = oldSlideContent.querySelector('.slide-title-container');
                if (titleContainer) {
                    titleContainer.classList.remove('visible');
                }
            }
        }
        
        if (!isTransitioning) {
            setControlsWaitingState(true);
        }
        pendingAction = action;
        if (currentSlideId) {
            hideAllTextBlocksForCurrentSlide();
        }
        if (action.type === 'SLIDE_TO_MENU_WITH_TRANSITION' || action.type === 'SLIDE_TO_MENU_NO_TRANSITION') {
            hideAllSlide5DetailImages();
            if (slide5BaseImage) slide5BaseImage.classList.remove('visible');
            if (slide5ControlButtonsContainer) slide5ControlButtonsContainer.classList.remove('visible');
        }
        closeMenuInfoPanel();
        let videoToWaitFor = currentSceneVideoElement;
        let videoToPlayAfterInitialEnd = null;
        let loopForVideoAfterInitialEnd = false;
        let subsequentPendingAction = null;
        let layerToActivateForNextVideo = null;
        
        // La precarga ya está hecha, solo preparamos los elementos de video.
        if (action.type === 'MENU_TO_SLIDE_WITH_TRANSITION') {
            videoToWaitFor = menuVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            targetSceneAfterTransition = { slideId: action.slideId, slideAnimation: action.slideAnimation };
            await prepareVideoElement(transitionVideoElement, action.entryTransition);
            subsequentPendingAction = { type: 'PLAY_SLIDE_AFTER_ENTRY_TRANSITION' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'SLIDE_TO_MENU_WITH_TRANSITION') {
            videoToWaitFor = currentSceneVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            await prepareVideoElement(transitionVideoElement, action.exitTransition);
            subsequentPendingAction = { type: 'SHOW_MENU_AFTER_EXIT_TRANSITION' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'SLIDE_TO_SLIDE_WITH_TRANSITION') {
            videoToWaitFor = currentSceneVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            targetSceneAfterTransition = { slideId: action.nextSlideId, slideAnimation: action.nextSlideAnimation };
            await prepareVideoElement(transitionVideoElement, action.slideTransitionVideo);
            subsequentPendingAction = { type: 'PLAY_SLIDE_AFTER_SLIDE_TRANSITION' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'INTRO_TO_MENU_WITH_VIDEO_SEQUENCE') {
            videoToWaitFor = introVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            await prepareVideoElement(transitionVideoElement, INTRO_TO_MENU_TRANSITION_VIDEO);
            subsequentPendingAction = { type: 'PLAY_MENU_AFTER_INTRO_TRANSITION' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'MENU_TO_INTRO_WITH_VIDEO_SEQUENCE') {
            videoToWaitFor = menuVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            await prepareVideoElement(transitionVideoElement, MENU_TO_INTRO_TRANSITION_VIDEO);
            subsequentPendingAction = { type: 'PLAY_INTRO_AFTER_MENU_TRANSITION' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'SLIDE2_DAY_TO_NIGHT') {
            videoToWaitFor = currentSceneVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            await prepareVideoElement(transitionVideoElement, SLIDE2_TO_NIGHT_TRANSITION);
            subsequentPendingAction = { type: 'PLAY_SLIDE2_NIGHT_VIDEO' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'SLIDE2_NIGHT_TO_DAY') {
            videoToWaitFor = currentSceneVideoElement;
            videoToPlayAfterInitialEnd = transitionVideoElement;
            await prepareVideoElement(transitionVideoElement, NIGHT_TO_SLIDE2_TRANSITION);
            subsequentPendingAction = { type: 'PLAY_SLIDE2_DAY_VIDEO' };
            layerToActivateForNextVideo = transitionVideoLayer;
        } else if (action.type === 'SLIDE_TO_SLIDE_NO_TRANSITION_BUFFER_SWAP') {
            videoToWaitFor = currentSceneVideoElement;
            await prepareVideoElement(nextSlideVideoElement, action.animationSrc);
            layerToActivateForNextVideo = slideVideoLayer;
            subsequentPendingAction = action;
        } else if (action.type === 'SLIDE_TO_MENU_NO_TRANSITION') {
            videoToWaitFor = currentSceneVideoElement;
            layerToActivateForNextVideo = menuVideoLayer;
            subsequentPendingAction = action;
        }

        if (videoToWaitFor && (videoToWaitFor.currentSrc || (videoToWaitFor.querySelector('source') && videoToWaitFor.querySelector('source').src)) ) {
            if (videoToWaitFor.loop) videoToWaitFor.loop = false;
            videoToWaitFor.removeEventListener('ended', onVideoEnded);
            videoToWaitFor.addEventListener('ended', async function handleInitialEnd() {
                videoToWaitFor.removeEventListener('ended', handleInitialEnd);
                const previouslyActiveLayer = videoToWaitFor.closest('.video-layer');
                if (videoToPlayAfterInitialEnd) {
                    if (subsequentPendingAction) {
                        pendingAction = subsequentPendingAction;
                    } else {
                         pendingAction = null;
                    }
                    [menuVideoLayer, slideVideoLayer, transitionVideoLayer, introVideoLayer].forEach(layer => {
                        if (layer !== layerToActivateForNextVideo) {
                            layer.classList.remove('active');
                            layer.querySelectorAll('video').forEach(vid => pauseVideo(vid));
                        }
                    });
                    if(layerToActivateForNextVideo) layerToActivateForNextVideo.classList.add('active');
                    if (videoToPlayAfterInitialEnd === slideVideoBuffer1) {
                        slideVideoBuffer2.classList.remove('visible');
                    } else if (videoToPlayAfterInitialEnd === slideVideoBuffer2) {
                        slideVideoBuffer1.classList.remove('visible');
                    } else {
                        videoToPlayAfterInitialEnd.classList.add('visible');
                    }
                    videoToPlayAfterInitialEnd.removeEventListener('ended', onVideoEnded);
                    videoToPlayAfterInitialEnd.addEventListener('ended', onVideoEnded, { once: true });
                    await playVideo(videoToPlayAfterInitialEnd, loopForVideoAfterInitialEnd);
                    if(videoToWaitFor && videoToPlayAfterInitialEnd && videoToWaitFor.id !== videoToPlayAfterInitialEnd.id){
                         if (previouslyActiveLayer && layerToActivateForNextVideo && previouslyActiveLayer.id !== layerToActivateForNextVideo.id){
                            setTimeout(() => {
                                 videoToWaitFor.classList.remove('visible');
                            }, 0);
                         } else if (previouslyActiveLayer && !layerToActivateForNextVideo) {
                             setTimeout(() => {
                                 videoToWaitFor.classList.remove('visible');
                            }, 0);
                         }
                    }
                } else {
                    onVideoEnded.call(videoToWaitFor);
                }
            }, { once: true });
            const isAlreadyEnded = videoToWaitFor.paused || videoToWaitFor.ended;
            const isAboutToEnd = videoToWaitFor.duration > 0 && videoToWaitFor.currentTime >= videoToWaitFor.duration - 0.05;
            if (isAlreadyEnded || isAboutToEnd) {
                 videoToWaitFor.dispatchEvent(new Event('ended'));
            }
        } else {
             if (videoToPlayAfterInitialEnd) {
                 if (subsequentPendingAction) {
                    pendingAction = subsequentPendingAction;
                 }
                [menuVideoLayer, slideVideoLayer, introVideoLayer].forEach(layer => {
                    if (layer !== layerToActivateForNextVideo) layer.classList.remove('active');
                });
                layerToActivateForNextVideo.classList.add('active');
                videoToPlayAfterInitialEnd.classList.add('visible');
                videoToPlayAfterInitialEnd.removeEventListener('ended', onVideoEnded);
                videoToPlayAfterInitialEnd.addEventListener('ended', onVideoEnded, { once: true });
                await playVideo(videoToPlayAfterInitialEnd, loopForVideoAfterInitialEnd);
            } else {
                onVideoEnded.call(videoToWaitFor || {});
            }
        }
    }

    function hideAllTextBlocksForCurrentSlide() {
        if (!currentSlideId && !activeTextBlock && !activeCircleButton) return;
        let slideContentToClean = null;
        if (currentSlideId) {
            slideContentToClean = document.querySelector(`.slide-specific-content[data-content-for-slide="${currentSlideId}"]`);
        } else if (activeCircleButton) {
            slideContentToClean = activeCircleButton.closest('.slide-specific-content');
        }
        if (slideContentToClean) {
            const textBlocks = slideContentToClean.querySelectorAll('.slide-main-interactive-area > .text-block.visible');
            const circleButtons = slideContentToClean.querySelectorAll('.circle-button.active');
            if (textBlocks) textBlocks.forEach(block => block.classList.remove('visible'));
            if (circleButtons) circleButtons.forEach(btn => btn.classList.remove('active'));
        }
        activeCircleButton = null;
        activeTextBlock = null;
    }

    document.querySelectorAll('#slide-interactive-elements .circle-button').forEach(button => {
        button.addEventListener('click', () => {
            if (isTransitioning || button.classList.contains('waiting')) {
                 return;
            }
            const parentSlideSpecificContent = button.closest('.slide-specific-content');
            if (!parentSlideSpecificContent || !parentSlideSpecificContent.classList.contains('active')) {
                return;
            }
            const targetId = button.getAttribute('data-text-target');
            const targetBlock = parentSlideSpecificContent.querySelector(`.slide-main-interactive-area > #${targetId}.text-block`);
            const currentlyActiveButtonInThisSlide = parentSlideSpecificContent.querySelector('.circle-button.active');
            const currentlyActiveTextBlockInThisSlide = parentSlideSpecificContent.querySelector('.slide-main-interactive-area > .text-block.visible');
            if (button.classList.contains('active')) {
                if(targetBlock) targetBlock.classList.remove('visible');
                button.classList.remove('active');
                if (activeCircleButton === button) activeCircleButton = null;
                if (activeTextBlock === targetBlock) activeTextBlock = null;
            } else {
                if (currentlyActiveTextBlockInThisSlide) currentlyActiveTextBlockInThisSlide.classList.remove('visible');
                if (currentlyActiveButtonInThisSlide) currentlyActiveButtonInThisSlide.classList.remove('active');
                if (targetBlock) {
                    targetBlock.classList.add('visible');
                    targetBlock.style.top = `${button.offsetTop-35}px`;
                    activeCircleButton = button;
                    activeTextBlock = targetBlock;
                    button.classList.add('active');
                } else {
                     activeCircleButton = null;
                     activeTextBlock = null;
                }
            }
        });
    });

    menuInfoButton.addEventListener('click', () => {
        if (isTransitioning || menuInfoButton.classList.contains('waiting')) return;
        menuInfoTextBlock.classList.toggle('visible');
        menuInfoButton.classList.toggle('active', menuInfoTextBlock.classList.contains('visible'));
    });

    function ensureNoActiveSlideElements() {
        hideAllTextBlocksForCurrentSlide();
        document.querySelectorAll('.slide-specific-content.active').forEach(ssc => ssc.classList.remove('active'));
        document.querySelectorAll('.slide-title-container.visible').forEach(t => t.classList.remove('visible'));
        if (slideInteractiveElements) slideInteractiveElements.style.display = 'none';
        if (slideBackToMenuButton) slideBackToMenuButton.style.display = 'none';
        currentSlideId = null;
        hideAllSlide5DetailImages();
        if (slide5BaseImage) slide5BaseImage.classList.remove('visible');
        if (slide5ControlButtonsContainer) slide5ControlButtonsContainer.classList.remove('visible');
        if (speechBubble) speechBubble.classList.remove('visible');
        isChristmasNightMode = false;
        if (toggleChristmasLightButton) toggleChristmasLightButton.textContent = "Encender la Navidad";
    }

    function actuallyShowIntroUi(comingFromVideoTransition = false) {
        currentUiLayer.classList.remove('active');
        introLayer.classList.add('active');
        currentUiLayer = introLayer;
        if (!comingFromVideoTransition) {
            transitionVideoLayer.classList.remove('active');
            pauseVideo(transitionVideoElement);
            transitionVideoElement.classList.remove('visible');
            menuVideoLayer.classList.remove('active');
            pauseVideo(menuVideoElement);
            slideVideoLayer.classList.remove('active');
            pauseVideo(slideVideoBuffer1);
            pauseVideo(slideVideoBuffer2);
            slideVideoBuffer1.classList.remove('visible');
            slideVideoBuffer2.classList.remove('visible');
        }
        introVideoLayer.classList.add('active');
        introVideoElement.classList.add('blurred');
        staticFrameImage.classList.add('blurred');
        currentSceneVideoElement = introVideoElement;
        playVideo(currentSceneVideoElement, true);
        uiOverlayLayer.classList.remove('active');
        ensureNoActiveSlideElements();
        menuInfoButton.style.display = 'none';
        menuInfoTextBlock.classList.remove('visible');
        menuBackToIntroButton.style.display = 'none';
        overlayImageLayer.classList.remove('hiding');
        introContentWrapper.classList.remove('visible');
        introDisclaimer.classList.remove('visible');
        if (creditsImage) creditsImage.classList.remove('visible');
        void introContentWrapper.offsetWidth;
        void introDisclaimer.offsetWidth;
        void overlayImageLayer.offsetWidth;
        if (creditsImage) void creditsImage.offsetWidth;
        setTimeout(() => {
            overlayImageLayer.classList.add('visible');
            introContentWrapper.classList.add('visible');
            introDisclaimer.classList.add('visible');
            if (creditsImage) creditsImage.classList.add('visible');
        }, 50);

        setControlsWaitingState(false);
    }

    function actuallyShowMenuUi(comingFromVideoTransition = false) {
        currentUiLayer.classList.remove('active');
        uiOverlayLayer.classList.add('active');
        currentUiLayer = uiOverlayLayer;
        overlayImageLayer.classList.remove('visible');
        overlayImageLayer.classList.remove('hiding');
        if (!comingFromVideoTransition) {
            transitionVideoLayer.classList.remove('active');
            pauseVideo(transitionVideoElement);
            transitionVideoElement.classList.remove('visible');
            introVideoLayer.classList.remove('active');
            slideVideoLayer.classList.remove('active');
            pauseVideo(introVideoElement);
            pauseVideo(slideVideoBuffer1);
            pauseVideo(slideVideoBuffer2);
            slideVideoBuffer1.classList.remove('visible');
            slideVideoBuffer2.classList.remove('visible');
        }
        menuVideoElement.classList.remove('blurred');
        staticFrameImage.classList.remove('blurred');
        menuVideoLayer.classList.add('active');
        currentSceneVideoElement = menuVideoElement;
        playVideo(currentSceneVideoElement, true);
        introContentWrapper.classList.remove('visible');
        introDisclaimer.classList.remove('visible');
        menuButtonsArea.style.display = 'flex';
        menuInfoButton.style.display = 'block';
        menuBackToIntroButton.style.display = 'block';
        ensureNoActiveSlideElements();
        uiOverlayLayer.style.justifyContent = 'center';
        uiOverlayLayer.style.alignItems = 'center';
        setTimeout(() => {
            if (speechBubble) speechBubble.classList.add('visible');
        }, 100);

        setControlsWaitingState(false);
    }

    function actuallyShowSlideUi(slideId, isInitialSlideTransition = true) {
        if (slideId === 'slide5') {
            setTimeout(() => {
                if (slide5BaseImage) slide5BaseImage.classList.add('visible');
                if (slide5ControlButtonsContainer) slide5ControlButtonsContainer.classList.add('visible');
            }, 50);
        }
        const prevSlideContent = document.querySelector(`.slide-specific-content[data-content-for-slide="${currentSlideId}"]`);
        if (prevSlideContent) prevSlideContent.classList.remove('active');
        currentSlideId = slideId;
        currentUiLayer.classList.remove('active');
        uiOverlayLayer.classList.add('active');
        currentUiLayer = uiOverlayLayer;
        introVideoLayer.classList.remove('active');
        menuVideoLayer.classList.remove('active');
        pauseVideo(introVideoElement);
        pauseVideo(menuVideoElement);
        staticFrameImage.classList.remove('blurred');
        slideVideoLayer.classList.add('active');
        if (isInitialSlideTransition) {
            slideVideoBuffer1.classList.remove('visible');
            slideVideoBuffer2.classList.remove('visible');
            currentSlideVideoElement.classList.add('visible');
            currentSceneVideoElement = currentSlideVideoElement;
            playVideo(currentSceneVideoElement, true);
        } else {
             currentSceneVideoElement = currentSlideVideoElement;
        }
        menuButtonsArea.style.display = 'none';
        menuInfoButton.style.display = 'none';
        menuInfoTextBlock.classList.remove('visible');
        menuInfoButton.classList.remove('active');
        menuBackToIntroButton.style.display = 'none';
        slideBackToMenuButton.style.display = 'block';
        slideInteractiveElements.style.display = 'flex';
        document.querySelectorAll('.slide-specific-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeSlideContent = document.querySelector(`.slide-specific-content[data-content-for-slide="${slideId}"]`);
        if (activeSlideContent) {
            activeSlideContent.classList.add('active');
            
            const titleContainer = activeSlideContent.querySelector('.slide-title-container');
            if (titleContainer) {
                setTimeout(() => {
                    titleContainer.classList.add('visible');
                }, 50);
            }

            const prevButton = activeSlideContent.querySelector('.slide-prev-button');
            const nextButton = activeSlideContent.querySelector('.slide-next-button');
            if (prevButton) {
                prevButton.textContent = prevButton.dataset.prevText || '← Anterior';
            }
            if (nextButton) {
                nextButton.textContent = nextButton.dataset.nextText || 'Siguiente →';
            }
            if (slideId === 'slide2' && !isChristmasNightMode) {
                 if (toggleChristmasLightButton) toggleChristmasLightButton.textContent = "Encender la Navidad";
            }
        } else {
            slideInteractiveElements.style.display = 'none';
            slideBackToMenuButton.style.display = 'none';
        }
        setControlsWaitingState(false);
    }


    // --- Event Listeners Principales ---
    toggleChristmasLightButton.addEventListener('click', () => {
        if (isTransitioning || toggleChristmasLightButton.classList.contains('waiting')) return;
        setControlsWaitingState(true);
        if (!isChristmasNightMode) {
            transitionToState({ type: 'SLIDE2_DAY_TO_NIGHT' });
        } else {
            nextActionAfterNightToDay = null; 
            transitionToState({ type: 'SLIDE2_NIGHT_TO_DAY' });
        }
    });

    slide5ControlButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetImageId = button.dataset.imageTarget;
            const targetImage = document.querySelector(`.slide5-image-overlays .slide5-overlay-image[data-image-for="${targetImageId}"]`);
            if (button.classList.contains('active')) {
                if (targetImage) targetImage.classList.remove('visible');
                button.classList.remove('active');
                activeSlide5ControlButton = null;
            } else {
                hideAllSlide5DetailImages();
                if (targetImage) targetImage.classList.add('visible');
                button.classList.add('active');
                activeSlide5ControlButton = button;
            }
        });
    });

    startExperienceButton.addEventListener('click', () => {
        if (isTransitioning || startExperienceButton.classList.contains('waiting')) return;
        setControlsWaitingState(true);
        introVideoElement.classList.remove('blurred');
        staticFrameImage.classList.remove('blurred');
        overlayImageLayer.classList.remove('visible');
        overlayImageLayer.classList.add('hiding');
        setTimeout(() => {
            introContentWrapper.classList.remove('visible');
            introDisclaimer.classList.remove('visible');
            if (creditsImage) creditsImage.classList.remove('visible');
            transitionToState({ type: 'INTRO_TO_MENU_WITH_VIDEO_SEQUENCE' });
        }, 200);
    });

    allMenuButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isTransitioning || button.classList.contains('waiting')) return;
            if (speechBubble) speechBubble.classList.remove('visible');
            const slideId = button.dataset.slideId;
            const slideAnimation = button.dataset.animation;
            const entryTransition = button.dataset.entryTransition;
            if (slideId && slideAnimation) {
                closeMenuInfoPanel();
                if (entryTransition) {
                    transitionToState({ type: 'MENU_TO_SLIDE_WITH_TRANSITION', slideId: slideId, slideAnimation: slideAnimation, entryTransition: entryTransition });
                } else {
                    transitionToState({ type: 'MENU_TO_SLIDE_NO_TRANSITION', slideId: slideId, slideAnimation: slideAnimation });
                }
            }
        });
    });

    slideBackToMenuButton.addEventListener('click', () => {
        if (isTransitioning || slideBackToMenuButton.classList.contains('waiting')) return;
        const menuButtonForCurrentSlide = document.querySelector(`.menu-button[data-slide-id="${currentSlideId}"]`);
        const exitTransition = menuButtonForCurrentSlide ? menuButtonForCurrentSlide.dataset.exitTransition : null;
        const action = { type: 'SLIDE_TO_MENU_WITH_TRANSITION', exitTransition: exitTransition };
        
        if (isChristmasNightMode) {
            nextActionAfterNightToDay = action;
            transitionToState({ type: 'SLIDE2_NIGHT_TO_DAY' });
        } else {
            transitionToState(action);
        }
    });

    menuBackToIntroButton.addEventListener('click', () => {
        if (isTransitioning || menuBackToIntroButton.classList.contains('waiting')) return;
        if (speechBubble) speechBubble.classList.remove('visible');
        setControlsWaitingState(true);
        closeMenuInfoPanel();
        transitionToState({ type: 'MENU_TO_INTRO_WITH_VIDEO_SEQUENCE' });
    });

    allSlideNextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isTransitioning || button.classList.contains('waiting')) return;
            const nextSlideId = button.dataset.nextSlideId;
            const nextAnimationPath = button.dataset.nextAnimation;
            const slideTransitionVideo = button.dataset.transitionVideo;
            if (nextSlideId && nextAnimationPath) {
                const action = { type: 'SLIDE_TO_SLIDE_WITH_TRANSITION', nextSlideId: nextSlideId, nextSlideAnimation: nextAnimationPath, slideTransitionVideo: slideTransitionVideo };
                if (isChristmasNightMode) {
                    nextActionAfterNightToDay = action;
                    transitionToState({ type: 'SLIDE2_NIGHT_TO_DAY' });
                } else {
                    transitionToState(action);
                }
            }
        });
    });

    allSlidePrevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isTransitioning || button.classList.contains('waiting')) return;
            const prevSlideId = button.dataset.prevSlideId;
            const prevAnimationPath = button.dataset.prevAnimation;
            const slideTransitionVideo = button.dataset.transitionVideo;
            if (prevSlideId && prevAnimationPath) {
                const action = { type: 'SLIDE_TO_SLIDE_WITH_TRANSITION', nextSlideId: prevSlideId, nextSlideAnimation: prevAnimationPath, slideTransitionVideo: slideTransitionVideo };
                if (isChristmasNightMode) {
                    nextActionAfterNightToDay = action;
                    transitionToState({ type: 'SLIDE2_NIGHT_TO_DAY' });
                } else {
                    transitionToState(action);
                }
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (isTransitioning) return;
        if (menuInfoTextBlock.classList.contains('visible') && !menuInfoTextBlock.contains(event.target) && event.target !== menuInfoButton) {
            closeMenuInfoPanel();
        }
        if (activeTextBlock && activeTextBlock.classList.contains('visible')) {
            const currentActiveSlideContent = document.querySelector(`.slide-specific-content[data-content-for-slide="${currentSlideId}"].active`);
            if (currentActiveSlideContent) {
                const isClickInsideActiveElements = activeTextBlock.contains(event.target) || (activeCircleButton && activeCircleButton.contains(event.target)) || event.target.closest('.circle-buttons-container');
                if (!isClickInsideActiveElements) {
                    hideAllTextBlocksForCurrentSlide();
                }
            }
        }
    });

    // --- FUNCIÓN DE INICIO PRINCIPAL (MODIFICADA) ---
    function startExperience() {
        if (appContainer) appContainer.style.display = 'block';
        window.addEventListener('resize', scaleAndCenterApp);

        // ================== INICIO DEL AJUSTE PARA MÓVILES ==================
        // En móviles, después de entrar en pantalla completa, el navegador necesita un 
        // breve momento para estabilizarse y reportar las dimensiones correctas.
        // Un pequeño retraso asegura que el escalado y la reproducción del video
        // se inicien cuando la vista esté completamente lista.
        setTimeout(() => {
            // 1. Ahora escalamos la app DENTRO del timeout, con las dimensiones correctas.
            scaleAndCenterApp();

            // 2. Ejecutamos el resto de la inicialización aquí.
            uiOverlayLayer.classList.remove('active');
            menuVideoLayer.classList.remove('active');
            slideVideoLayer.classList.remove('active');
            transitionVideoLayer.classList.remove('active');
            ensureNoActiveSlideElements();
            menuBackToIntroButton.style.display = 'none';
            staticFrameImage.classList.remove('blurred');
            overlayImageLayer.classList.remove('visible');
            overlayImageLayer.classList.remove('hiding');

            // 3. Mostramos la intro, lo que iniciará la reproducción del video.
            actuallyShowIntroUi();

        }, 100); // 100ms es un valor seguro y robusto.
        // =================== FIN DEL AJUSTE PARA MÓVILES ====================
    }
    
    // --- LÓGICA DE ARRANQUE ---
    // Decidir si iniciar la carga o mostrar el prompt de móvil
    // Usamos una comprobación más robusta para dispositivos táctiles/móviles
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 1025);

    if (isMobile) {
        if (mobilePrompt) mobilePrompt.style.display = 'flex';
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (appContainer) appContainer.style.display = 'none';
    } else {
        // En escritorio, iniciamos la carga directamente
        if(mobilePrompt) mobilePrompt.style.display = 'none';
        preloadAllAssets().then(() => {
            startExperience();
            appInitialized = true;
        });
    }
});
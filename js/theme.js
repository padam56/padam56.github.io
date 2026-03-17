;(function($) {
    "use strict";
  
    /*----------------------------------------------------*/
    /*  Menu scroll js
    /*----------------------------------------------------*/
    var nav_offset_top = $('.header_area').length ? $('.header_area').offset().top : 0;
    function stickyHeader() {
		if ($('.header_area').length) {
			var strickyScrollPos = nav_offset_top;
			if($(window).scrollTop() > strickyScrollPos) {
				$('.header_area').removeClass('fadeIn animated');
				$('.header_area').addClass('stricky-fixed fadeInDown animated')
			}
			else if($(window).scrollTop() <= strickyScrollPos) {
				$('.header_area').removeClass('stricky-fixed fadeInDown animated');
				$('.header_area').addClass('slideIn animated')
			}
		}
	}
    
    // Throttle sticky header updates to animation frames.
    var stickyTicking = false;
    $(window).on('scroll', function () {
        if (stickyTicking) return;
        stickyTicking = true;
        window.requestAnimationFrame(function() {
            stickyHeader();
            stickyTicking = false;
        });
    })
    
    /*----------------------------------------------------*/
    /*  Skill js
    /*----------------------------------------------------*/
    $(".skill_item_inner").each(function() {
        $(this).waypoint(function() {
            var progressBar = $(".progress-bar");
            progressBar.each(function(indx){
                var $bar = $(this);
                $bar.css("width", "0%");
                setTimeout(function() {
                    $bar.css("width", $bar.attr("aria-valuenow") + "%").addClass("bar-animated");
                }, 55 * indx);
            });
        }, {
            triggerOnce: true,
            offset: '85%'

        });
    });
    
    /*----------------------------------------------------*/
    /*  portfolio_isotope
    /*----------------------------------------------------*/
    function our_gallery(){
        if ( $('.portfolio_area').length ){
            // Activate isotope in container
            $(".portfolio_list_inner").imagesLoaded( function() {
                $(".portfolio_list_inner").isotope({
                    itemSelector: ".col-md-4",
                }); 
            }); 
            // Add isotope click function
            $(".porfolio_menu ul li").on('click',function(){
                $(".porfolio_menu ul li").removeClass("active");
                $(this).addClass("active");

                var selector = $(this).attr("data-filter");
                $(".portfolio_list_inner").isotope({
                    filter: selector,
                    animationOptions: {
                        duration: 450,
                        easing: "linear",
                        queue: false,
                    }
                });
                return false;
            });
        }
    }
    our_gallery();

    
    /*----------------------------------------------------*/
    /*  Blog slider
    /*----------------------------------------------------*/
    function blog_slider(){
        if ( $('.blog_slider_inner').length ){
            $('.blog_slider_inner').owlCarousel({
                loop: true,
                margin: 0,
                nav: true,
                items: 1,
                autoplay: false,
                smartSpeed: 1500,
                navContainer: '.blog_slider_area',
                navText: ['<i class="fa fa-long-arrow-left" aria-hidden="true"></i>','<i class="fa fa-long-arrow-right" aria-hidden="true"></i>']
            });
        }
    }
    blog_slider();
    
    
    
    /*----------------------------------------------------*/
    /*  Google map js
    /*----------------------------------------------------*/
    
    if ( $('#mapBox').length ){
        var $lat = $('#mapBox').data('lat');
        var $lon = $('#mapBox').data('lon');
        var $zoom = $('#mapBox').data('zoom');
        var map = new GMaps({
            el: '#mapBox',
            lat: $lat,
            lng: $lon,
            scrollwheel: false,
            scaleControl: true,
            streetViewControl: false,
            panControl: true,
            disableDoubleClickZoom: true,
            mapTypeControl: false,
            zoom: $zoom,
                styles: [{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"simplified"},{"hue":"#ff0000"}]}]
            });
        
        }
    
        
//    
//        $('.header_area .nav.navbar-nav li').click(function(e) {
//            e.preventDefault(); //prevent the link from being followed
//            $('.header_area .nav.navbar-nav li').removeClass('active');
//            $(this).addClass('active');
//        });
    
    
    $('.header_area .nav.navbar-nav li a[href^="#"]:not([href="#"]), .footer_copyright .nav.navbar-nav li a[href^="#"]:not([href="#"])').on('click', function(event) {
        var targetId = $(this).attr('href');
        var target = document.querySelector(targetId);
        if (!target) return;

        // On mobile, close the open header nav after link tap.
        var isHeaderNavLink = $(this).closest('.header_area').length > 0;
        if (isHeaderNavLink) {
            var $headerCollapse = $('.header_area .navbar.navbar-default .navbar-collapse');
            var $headerToggle = $('.header_area .navbar-toggle');
            if ($headerCollapse.hasClass('in')) {
                if (typeof $headerCollapse.collapse === 'function') {
                    $headerCollapse.collapse('hide');
                } else {
                    $headerCollapse.removeClass('in').attr('aria-expanded', 'false');
                    $headerToggle.addClass('collapsed').attr('aria-expanded', 'false');
                }
            }
        }

        var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth'
        });
        event.preventDefault();
    });

    // Keep navigation state synced with current section while scrolling.
    var sectionSelector = '#about, #skill, #journey, #service, #contact';
    function setActiveNav() {
        var scrollPos = $(window).scrollTop() + 110;
        $(sectionSelector).each(function() {
            var $section = $(this);
            if (scrollPos >= $section.offset().top && scrollPos < ($section.offset().top + $section.outerHeight())) {
                var id = $section.attr('id');
                $('.header_area .nav.navbar-nav li').removeClass('active');
                $('.header_area .nav.navbar-nav li a[href="#' + id + '"]').parent().addClass('active');
                $('.footer_copyright .nav.navbar-nav li').removeClass('active');
                $('.footer_copyright .nav.navbar-nav li a[href="#' + id + '"]').parent().addClass('active');
            }
        });
    }

    // Throttle nav state sync to animation frames.
    var navTicking = false;
    $(window).on('scroll', function() {
        if (navTicking) return;
        navTicking = true;
        window.requestAnimationFrame(function() {
            setActiveNav();
            navTicking = false;
        });
    });
    
    
    function bodyScrollAnimation() {
        var scrollAnimate = $('body').data('scroll-animation');
        if (scrollAnimate === true) {
            new WOW({
                mobile: false
            }).init()
        }
    }
    bodyScrollAnimation();
    
    
    // preloader js
        $(window).on('load', function() {
                var $preloader = $('#preloader');
                $preloader.addClass('is-hidden');
                window.setTimeout(function() {
                    $preloader.hide();
                }, 760);
                $('body').css({'overflow':'visible'})
                setActiveNav();

                var now = new Date().getFullYear();
                $('#current-year').text(now);
        })
    
})(jQuery);

(function() {
    "use strict";

    function setupDefaultVisualExperience() {
        document.body.setAttribute("data-visual-mode", "network");
        document.body.classList.add("interaction-choreo", "interaction-micro");
    }

    function setupSectionChoreography() {
        var sections = document.querySelectorAll("#about, #skill, #journey, #intel-map, #service, #contact");
        if (!sections.length) return;

        var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            sections.forEach(function(section) {
                section.classList.add("section-visible");
            });
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("section-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.16,
            rootMargin: "0px 0px -10% 0px"
        });

        sections.forEach(function(section) {
            if (section.classList.contains("section-visible")) return;
            observer.observe(section);
        });
    }

    function setupCardPointerGlow() {
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        if (reduced || coarsePointer) return;

        document.querySelectorAll(".service_item, .journey_card").forEach(function(card) {
            var raf = 0;
            var lastEvt = null;

            function paint() {
                raf = 0;
                if (!lastEvt) return;
                var rect = card.getBoundingClientRect();
                var x = ((lastEvt.clientX - rect.left) / rect.width) * 100;
                var y = ((lastEvt.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty("--mx", x.toFixed(2) + "%");
                card.style.setProperty("--my", y.toFixed(2) + "%");
            }

            card.addEventListener("mousemove", function(evt) {
                lastEvt = evt;
                if (raf) return;
                raf = window.requestAnimationFrame(paint);
            }, { passive: true });
        });
    }

    function setupScrollProgress() {
        var fill = document.querySelector("#top-progress .top_progress_fill");
        if (!fill) return;

        function update() {
            var doc = document.documentElement;
            var max = Math.max(1, doc.scrollHeight - window.innerHeight);
            var progress = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
            fill.style.width = progress + "%";
        }

        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update, { passive: true });
        update();
    }

    function setupProjectFilter() {
        var buttons = document.querySelectorAll(".modern_filter_btn");
        var groups = document.querySelectorAll(".project_group");
        var emptyState = document.getElementById("project-empty-state");
        if (!buttons.length || !groups.length) return;

        function apply(filter) {
            var visibleCount = 0;
            groups.forEach(function(group) {
                var showGroup = group.getAttribute("data-group") === filter;
                group.style.display = showGroup ? "" : "none";
                if (showGroup) {
                    var cols = group.querySelectorAll(".col-md-6");
                    visibleCount += cols.length;
                    cols.forEach(function(col) {
                        col.style.display = "block";
                        var card = col.querySelector(".service_item");
                        if (card) {
                            // Ensure cards are immediately visible when filter changes,
                            // even if WOW previously kept them hidden off-scroll.
                            card.style.visibility = "visible";
                            card.classList.add("animated");
                        }
                    });
                }
            });

            if (emptyState) emptyState.hidden = visibleCount > 0;

            buttons.forEach(function(btn) {
                btn.classList.toggle("is-active", btn.getAttribute("data-filter") === filter);
            });
        }

        buttons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                apply(btn.getAttribute("data-filter"));
            });
        });

        var defaultBtn = document.querySelector(".modern_filter_btn.is-active") || buttons[0];
        apply(defaultBtn.getAttribute("data-filter"));
    }

    function setupContactReveal() {
        var toggle = document.getElementById("contact-reveal-toggle");
        var panel = document.getElementById("contact-reveal-content");
        if (!toggle || !panel) return;

        toggle.addEventListener("click", function() {
            var expanded = toggle.getAttribute("aria-expanded") === "true";
            var next = !expanded;
            toggle.setAttribute("aria-expanded", String(next));
            toggle.textContent = next ? "Hide Contact Details" : "Reveal Contact Details";
            panel.hidden = !next;
        });
    }

    var blueprintDemosLoadPromise = null;
    function ensureBlueprintDemosLoaded() {
        if (
            typeof window.setupSegmentationDemo === "function" &&
            typeof window.setupExplainabilityDemo === "function" &&
            typeof window.setupSyntheticBoosterDemo === "function" &&
            typeof window.setupClassicMlDemo === "function" &&
            typeof window.setupEdgeBenchmarkDemo === "function"
        ) {
            return Promise.resolve();
        }

        if (blueprintDemosLoadPromise) return blueprintDemosLoadPromise;

        blueprintDemosLoadPromise = new Promise(function(resolve, reject) {
            var existing = document.querySelector('script[data-blueprint-demos="1"]');

            function validateLoadedScript() {
                if (
                    typeof window.setupSegmentationDemo === "function" &&
                    typeof window.setupExplainabilityDemo === "function" &&
                    typeof window.setupSyntheticBoosterDemo === "function" &&
                    typeof window.setupClassicMlDemo === "function" &&
                    typeof window.setupEdgeBenchmarkDemo === "function"
                ) {
                    resolve();
                } else {
                    reject(new Error("Blueprint demos script loaded but setup functions are unavailable."));
                }
            }

            function onLoad(evt) {
                if (evt && evt.currentTarget && evt.currentTarget.setAttribute) {
                    evt.currentTarget.setAttribute("data-loaded", "true");
                }
                validateLoadedScript();
            }

            function onError() {
                reject(new Error("Failed to load js/blueprint-demos.js"));
            }

            if (existing) {
                if (existing.getAttribute("data-loaded") === "true") {
                    validateLoadedScript();
                    return;
                }
                existing.addEventListener("load", onLoad, { once: true });
                existing.addEventListener("error", onError, { once: true });
                return;
            }

            var script = document.createElement("script");
            script.src = "js/blueprint-demos.js?v=20260316-12";
            script.async = true;
            script.defer = true;
            script.setAttribute("data-blueprint-demos", "1");
            script.addEventListener("load", onLoad, { once: true });
            script.addEventListener("error", onError, { once: true });
            (document.head || document.body).appendChild(script);
        }).catch(function(err) {
            // Allow retry on the next interaction if loading fails once.
            blueprintDemosLoadPromise = null;
            throw err;
        });

        return blueprintDemosLoadPromise;
    }

    function setupAiBlueprintTabs() {
        var tabs = document.querySelectorAll(".ai_blueprint_tab");
        var panels = document.querySelectorAll(".ai_blueprint_panel");
        if (!tabs.length || !panels.length) return;

        var demoInitState = {
            seg: false,
            xai: false,
            aug: false,
            ml: false,
            edge: false
        };

        function ensureDemoInitialized(view) {
            if (!demoInitState.hasOwnProperty(view) || demoInitState[view]) return;

            ensureBlueprintDemosLoaded().then(function() {
                if (demoInitState[view]) return;

                if (view === "seg") {
                    if (typeof window.setupSegmentationDemo !== "function") {
                        throw new Error("Missing initializer for blueprint view: seg");
                    }
                    window.setupSegmentationDemo();
                    if (typeof window.setupExplainabilityDemo === "function") window.setupExplainabilityDemo();
                    if (typeof window.setupSyntheticBoosterDemo === "function") window.setupSyntheticBoosterDemo();
                    demoInitState.seg = true;
                    demoInitState.xai = true;
                    demoInitState.aug = true;
                    return;
                }

                var initializer = null;
                if (view === "xai") initializer = window.setupExplainabilityDemo;
                else if (view === "aug") initializer = window.setupSyntheticBoosterDemo;
                else if (view === "ml") initializer = window.setupClassicMlDemo;
                else if (view === "edge") initializer = window.setupEdgeBenchmarkDemo;

                if (typeof initializer !== "function") {
                    throw new Error("Missing initializer for blueprint view: " + view);
                }

                initializer();
                demoInitState[view] = true;
            }).catch(function(err) {
                // Keep app resilient if a single lab fails to initialize.
                console.error("Failed to initialize demo view:", view, err);
            });
        }

        function normalizeView(raw) {
            if (!raw) return "";
            return String(raw).toLowerCase().replace(/^ai-view-/, "").trim();
        }

        function resolveInitialView() {
            var params = new URLSearchParams(window.location.search || "");
            var viaQuery = normalizeView(params.get("view"));
            if (viaQuery) return viaQuery;

            var hash = normalizeView((window.location.hash || "").replace(/^#/, ""));
            if (hash) return hash;
            return "";
        }

        function activate(view, updateUrl) {
            var normalized = normalizeView(view);
            if (!normalized) return;
            tabs.forEach(function(tab) {
                var isActive = tab.getAttribute("data-ai-view") === normalized;
                tab.classList.toggle("is-active", isActive);
                tab.setAttribute("aria-selected", String(isActive));
            });

            panels.forEach(function(panel) {
                var panelView = panel.id.replace("ai-view-", "");
                var isActive = panelView === normalized;
                panel.classList.toggle("is-active", isActive);
                panel.hidden = !isActive;
            });

            ensureDemoInitialized(normalized);

            if (updateUrl && window.history && window.history.replaceState) {
                var params = new URLSearchParams(window.location.search || "");
                params.set("view", normalized);
                var next = window.location.pathname + "?" + params.toString() + "#ai-blueprint";
                window.history.replaceState(null, "", next);
            }
        }

        tabs.forEach(function(tab) {
            tab.addEventListener("click", function() {
                activate(tab.getAttribute("data-ai-view"), true);
            });
        });

        var segCta = document.querySelector(".seg_lab_open_btn");
        if (segCta) {
            segCta.addEventListener("click", function() {
                activate("seg");
            });
        }

        var defaultTab = document.querySelector(".ai_blueprint_tab.is-active") || tabs[0];
        var initialView = resolveInitialView();
        var exists = initialView && document.querySelector('.ai_blueprint_tab[data-ai-view="' + initialView + '"]');
        activate(exists ? initialView : defaultTab.getAttribute("data-ai-view"), false);

        var quickLinks = document.querySelectorAll("[data-blueprint-view]");
        quickLinks.forEach(function(link) {
            link.addEventListener("click", function(evt) {
                var v = link.getAttribute("data-blueprint-view");
                if (!v) return;
                evt.preventDefault();
                activate(v, true);
                var root = document.getElementById("ai-blueprint");
                if (root && root.scrollIntoView) root.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    function setupAiBlueprintInteractions() {
        if (!document.querySelector(".ai_blueprint_area")) return;

        var stageCards = document.querySelectorAll(".ml_stage_card");
        var lifecycleTrack = document.querySelector(".ml_lifecycle_track");
        var stageTitle = document.getElementById("ml-stage-title");
        var stageDetail = document.getElementById("ml-stage-detail");
        var stageArtifact = document.getElementById("ml-stage-artifact");
        var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function activateStage(card) {
            if (!card || !stageTitle || !stageDetail || !stageArtifact) return;
            stageCards.forEach(function(item) {
                var active = item === card;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
            });

            stageTitle.textContent = card.getAttribute("data-stage") || "Stage";
            stageDetail.textContent = card.getAttribute("data-detail") || "";
            stageArtifact.textContent = "Primary Artifact: " + (card.getAttribute("data-artifact") || "N/A");
        }

        stageCards.forEach(function(card) {
            card.addEventListener("click", function() {
                activateStage(card);
            });

            card.addEventListener("keydown", function(evt) {
                if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    activateStage(card);
                }
            });
        });

        var defaultStage = document.querySelector(".ml_stage_card.is-active") || stageCards[0];
        activateStage(defaultStage);

        var pipeline = document.querySelector(".cv_pipeline_graph");
        if (pipeline) {
            pipeline.classList.add("is-flowing");
        }

        var readinessWrap = document.getElementById("readiness-showcase");
        var lensButtons = readinessWrap ? readinessWrap.querySelectorAll(".readiness_lens_btn") : [];
        var readinessCards = readinessWrap ? readinessWrap.querySelectorAll(".readiness_capability") : [];
        var readinessStages = readinessWrap ? readinessWrap.querySelectorAll(".readiness_stage_btn") : [];
        var readinessSummary = document.getElementById("readiness-summary");
        var readinessActiveCard = 0;

        function currentLens() {
            var active = "all";
            lensButtons.forEach(function(btn) {
                if (btn.classList.contains("is-active")) active = btn.getAttribute("data-readiness-lens") || "all";
            });
            return active;
        }

        function currentStage() {
            var stage = "prototype";
            readinessStages.forEach(function(btn) {
                if (btn.classList.contains("is-active")) stage = btn.getAttribute("data-readiness-stage") || "prototype";
            });
            return stage;
        }

        function stageBoost(stage) {
            if (stage === "pilot") return 4;
            if (stage === "production") return 9;
            if (stage === "scale") return 12;
            return 0;
        }

        function applyReadinessView() {
            if (!readinessCards.length) return;
            var lens = currentLens();
            var stage = currentStage();
            var boost = stageBoost(stage);

            readinessCards.forEach(function(card, index) {
                var base = parseInt(card.getAttribute("data-score-" + lens), 10);
                if (isNaN(base)) base = parseInt(card.getAttribute("data-score-all"), 10) || 70;
                var score = Math.max(45, Math.min(99, base + boost));
                var meter = card.querySelector(".readiness_meter span");
                var value = card.querySelector(".readiness_value");
                if (meter) meter.style.width = score + "%";
                if (value) value.textContent = String(score);
                card.classList.toggle("is-active", index === readinessActiveCard);
            });

            var activeCard = readinessCards[readinessActiveCard];
            if (readinessSummary && activeCard) {
                var cap = activeCard.getAttribute("data-capability") || "Capability";
                var note = activeCard.getAttribute("data-note") || "Readiness detail unavailable.";
                readinessSummary.textContent = stage.charAt(0).toUpperCase() + stage.slice(1) + " stage, " + lens + " lens: " + cap + ". " + note;
            }
        }

        function nextReadinessCard() {
            if (!readinessCards.length) return;
            readinessActiveCard = (readinessActiveCard + 1) % readinessCards.length;
            applyReadinessView();
        }

        lensButtons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                lensButtons.forEach(function(item) {
                    var active = item === btn;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-selected", String(active));
                });
                applyReadinessView();
            });
        });

        readinessStages.forEach(function(btn) {
            btn.addEventListener("click", function() {
                readinessStages.forEach(function(item) {
                    var active = item === btn;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-selected", String(active));
                });
                applyReadinessView();
            });
        });

        readinessCards.forEach(function(card, index) {
            card.addEventListener("mouseenter", function() {
                readinessActiveCard = index;
                applyReadinessView();
            });
            card.addEventListener("focusin", function() {
                readinessActiveCard = index;
                applyReadinessView();
            });
        });

        if (lensButtons.length || readinessCards.length) {
            applyReadinessView();
        }

        var playbookSteps = document.querySelectorAll(".playbook_step");
        var playbookTitle = document.getElementById("playbook-step-title");
        var playbookDetail = document.getElementById("playbook-step-detail");
        var playbookOutput = document.getElementById("playbook-step-output");
        var playbookShell = document.querySelector(".project_playbook");

        function activatePlaybook(step) {
            if (!step || !playbookTitle || !playbookDetail || !playbookOutput) return;

            playbookSteps.forEach(function(item) {
                var active = item === step;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
            });

            playbookTitle.textContent = step.getAttribute("data-step-title") || "Project Step";
            playbookDetail.textContent = step.getAttribute("data-step-detail") || "";
            playbookOutput.textContent = step.getAttribute("data-step-output") || "";
        }

        playbookSteps.forEach(function(step) {
            step.addEventListener("click", function() {
                activatePlaybook(step);
            });
        });

        var defaultPlaybook = document.querySelector(".playbook_step.is-active") || playbookSteps[0];
        if (defaultPlaybook) activatePlaybook(defaultPlaybook);

        var lifecycleTimer = null;
        var lifecycleResumeTimer = null;
        var readinessLensTimer = null;
        var readinessRowTimer = null;
        var playbookTimer = null;
        var playbookResumeTimer = null;

        function activePlaybookIndex() {
            for (var i = 0; i < playbookSteps.length; i += 1) {
                if (playbookSteps[i].classList.contains("is-active")) return i;
            }
            return 0;
        }

        function stopPlaybookLiveFlow() {
            if (playbookTimer) {
                window.clearInterval(playbookTimer);
                playbookTimer = null;
            }
            if (playbookResumeTimer) {
                window.clearTimeout(playbookResumeTimer);
                playbookResumeTimer = null;
            }
            if (playbookShell) playbookShell.classList.remove("is-live");
        }

        function activeStageIndex() {
            for (var i = 0; i < stageCards.length; i += 1) {
                if (stageCards[i].classList.contains("is-active")) return i;
            }
            return 0;
        }

        function stopLifecycleFlow() {
            if (lifecycleTimer) {
                window.clearInterval(lifecycleTimer);
                lifecycleTimer = null;
            }
            if (lifecycleResumeTimer) {
                window.clearTimeout(lifecycleResumeTimer);
                lifecycleResumeTimer = null;
            }
            if (lifecycleTrack) lifecycleTrack.classList.remove("is-live");
        }

        function startLifecycleFlow() {
            if (prefersReducedMotion || stageCards.length < 2) return;
            stopLifecycleFlow();
            if (lifecycleTrack) lifecycleTrack.classList.add("is-live");
            lifecycleTimer = window.setInterval(function() {
                if (document.hidden) return;
                var nextStage = (activeStageIndex() + 1) % stageCards.length;
                activateStage(stageCards[nextStage]);
            }, 3400);
        }

        function scheduleLifecycleResume() {
            if (prefersReducedMotion || stageCards.length < 2) return;
            if (lifecycleResumeTimer) window.clearTimeout(lifecycleResumeTimer);
            lifecycleResumeTimer = window.setTimeout(startLifecycleFlow, 3600);
        }

        function stopReadinessFlow() {
            if (readinessLensTimer) {
                window.clearInterval(readinessLensTimer);
                readinessLensTimer = null;
            }
            if (readinessRowTimer) {
                window.clearInterval(readinessRowTimer);
                readinessRowTimer = null;
            }
            if (readinessWrap) readinessWrap.classList.remove("is-live");
        }

        function startReadinessFlow() {
            if (prefersReducedMotion || !lensButtons.length || !readinessCards.length) return;
            stopReadinessFlow();
            if (readinessWrap) readinessWrap.classList.add("is-live");

            readinessLensTimer = window.setInterval(function() {
                if (document.hidden) return;
                var activeIndex = 0;
                lensButtons.forEach(function(btn, idx) {
                    if (btn.classList.contains("is-active")) activeIndex = idx;
                });
                var nextLensBtn = lensButtons[(activeIndex + 1) % lensButtons.length];
                if (nextLensBtn) {
                    var nextLens = nextLensBtn.getAttribute("data-readiness-lens");
                    if (nextLens) nextLensBtn.click();
                }
            }, 4200);

            readinessRowTimer = window.setInterval(function() {
                if (document.hidden) return;
                nextReadinessCard();
            }, 1800);
        }

        function startPlaybookLiveFlow() {
            if (prefersReducedMotion || playbookSteps.length < 2) return;
            stopPlaybookLiveFlow();
            if (playbookShell) playbookShell.classList.add("is-live");
            playbookTimer = window.setInterval(function() {
                if (document.hidden) return;
                var next = (activePlaybookIndex() + 1) % playbookSteps.length;
                activatePlaybook(playbookSteps[next]);
            }, 2300);
        }

        function schedulePlaybookResume() {
            if (prefersReducedMotion || playbookSteps.length < 2) return;
            if (playbookResumeTimer) window.clearTimeout(playbookResumeTimer);
            playbookResumeTimer = window.setTimeout(startPlaybookLiveFlow, 2600);
        }

        playbookSteps.forEach(function(step) {
            step.addEventListener("click", function() {
                stopPlaybookLiveFlow();
                schedulePlaybookResume();
            });
        });

        stageCards.forEach(function(card) {
            card.addEventListener("click", function() {
                stopLifecycleFlow();
                scheduleLifecycleResume();
            });
        });

        if (lifecycleTrack) {
            lifecycleTrack.addEventListener("mouseenter", stopLifecycleFlow);
            lifecycleTrack.addEventListener("mouseleave", startLifecycleFlow);
            lifecycleTrack.addEventListener("focusin", stopLifecycleFlow);
            lifecycleTrack.addEventListener("focusout", function() {
                scheduleLifecycleResume();
            });
        }

        if (readinessWrap) {
            readinessWrap.addEventListener("mouseenter", stopReadinessFlow);
            readinessWrap.addEventListener("mouseleave", startReadinessFlow);
            readinessWrap.addEventListener("focusin", stopReadinessFlow);
            readinessWrap.addEventListener("focusout", startReadinessFlow);
        }

        if (playbookShell) {
            playbookShell.addEventListener("mouseenter", stopPlaybookLiveFlow);
            playbookShell.addEventListener("mouseleave", startPlaybookLiveFlow);
            playbookShell.addEventListener("focusin", stopPlaybookLiveFlow);
            playbookShell.addEventListener("focusout", function() {
                schedulePlaybookResume();
            });
        }

        document.addEventListener("visibilitychange", function() {
            if (document.hidden) {
                stopLifecycleFlow();
                stopReadinessFlow();
                stopPlaybookLiveFlow();
            } else {
                startLifecycleFlow();
                startReadinessFlow();
                startPlaybookLiveFlow();
            }
        });

        startLifecycleFlow();
        startReadinessFlow();
        startPlaybookLiveFlow();
    }

    function setupAboutFocusTypewriter() {
        var focusTarget = document.getElementById("focus-typewriter-text");
        if (!focusTarget) return;

        var focusPhrases = [
            "Full-Stack Software Engineer",
            "Internet Security Researcher",
            "Web Measurement Specialist",
            "Java Microservices Engineer",
            "MLOps and Cloud Engineer"
        ];

        var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            if (focusTarget) focusTarget.textContent = focusPhrases[0];
            return;
        }

        var phraseIndex = 0;
        var charIndex = 0;
        var deleting = false;
        var timer = null;
        var firstPhraseDisplayed = false;
        
        // Timing configuration - more generous for visibility
        var FIRST_PHRASE_HOLD_MS = 5800;  // 5.8 seconds for first phrase (very visible)
        var PHRASE_HOLD_MS = 4200;         // 4.2 seconds for other phrases (well-visible)
        var CHAR_APPEAR_MS = 75;           // 75ms per character (slower for visibility)
        var CHAR_ERASE_MS = 55;            // 55ms per character erase (smooth)
        var TRANSITION_DELAY_MS = 520;     // 520ms pause before next phrase starts typing

        // Display the first phrase and start countdown
        function displayPhrase(index) {
            focusTarget.textContent = focusPhrases[index];
            focusTarget.style.opacity = "1";
        }

        function schedule(ms) {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(tick, ms);
        }

        function tick() {
            var phrase = focusPhrases[phraseIndex];

            // TYPING PHASE
            if (!deleting) {
                if (charIndex === 0) {
                    // Start typing this phrase from scratch
                    focusTarget.textContent = "";
                    focusTarget.style.opacity = "1";
                }
                
                charIndex = Math.min(phrase.length, charIndex + 1);
                focusTarget.textContent = phrase.slice(0, charIndex);
                
                if (charIndex === phrase.length) {
                    // Finished typing - hold the phrase
                    deleting = true;
                    var holdTime = !firstPhraseDisplayed && phraseIndex === 0 ? FIRST_PHRASE_HOLD_MS : PHRASE_HOLD_MS;
                    firstPhraseDisplayed = true;
                    schedule(holdTime);
                    return;
                }
                // Continue typing
                schedule(CHAR_APPEAR_MS + Math.random() * 12);
                return;
            }

            // ERASING PHASE
            charIndex = Math.max(0, charIndex - 1);
            focusTarget.textContent = phrase.slice(0, charIndex);
            
            if (charIndex === 0) {
                // Finished erasing - move to next phrase
                deleting = false;
                phraseIndex = (phraseIndex + 1) % focusPhrases.length;
                // Transition delay before typing next phrase
                schedule(TRANSITION_DELAY_MS);
                return;
            }
            // Continue erasing
            schedule(CHAR_ERASE_MS + Math.random() * 8);
        }

        // Initialize with first phrase displayed for full duration
        displayPhrase(0);
        schedule(FIRST_PHRASE_HOLD_MS);

        // Cleanup on page unload
        window.addEventListener("beforeunload", function() {
            if (timer) window.clearTimeout(timer);
        });
    }

    function setupProfilePic3DSmoothing() {
        var pic = document.querySelector(".about_person_area .person_img img");
        var shell = document.querySelector(".about_person_area .person_img");
        if (!pic || !shell) return;

        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var maxTilt = reduceMotion ? 6 : 12;
        var target = { x: 0, y: 0 };
        var current = { x: 0, y: 0 };
        var raf = 0;

        function setTilt(x, y) {
            pic.style.setProperty("--pic-rot-y", x.toFixed(2) + "deg");
            pic.style.setProperty("--pic-rot-x", y.toFixed(2) + "deg");
        }

        function animateTilt() {
            current.x += (target.x - current.x) * 0.16;
            current.y += (target.y - current.y) * 0.16;
            setTilt(current.x, current.y);

            var epsilon = 0.08;
            if (Math.abs(target.x - current.x) > epsilon || Math.abs(target.y - current.y) > epsilon) {
                raf = window.requestAnimationFrame(animateTilt);
            } else {
                raf = 0;
            }
        }

        function queueAnimate() {
            if (!raf) raf = window.requestAnimationFrame(animateTilt);
        }

        function pointToTilt(clientX, clientY) {
            var rect = pic.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            var normX = (clientX - cx) / Math.max(1, rect.width / 2);
            var normY = (clientY - cy) / Math.max(1, rect.height / 2);

            target.x = Math.max(-maxTilt, Math.min(maxTilt, normX * maxTilt));
            target.y = Math.max(-maxTilt, Math.min(maxTilt, -normY * maxTilt));
            pic.classList.add("smooth-3d");
            shell.classList.add("is-interacting");
            queueAnimate();
        }

        function resetTilt() {
            target.x = 0;
            target.y = 0;
            shell.classList.remove("is-interacting");
            queueAnimate();
            window.setTimeout(function() {
                if (Math.abs(current.x) < 0.18 && Math.abs(current.y) < 0.18) {
                    pic.classList.remove("smooth-3d");
                }
            }, 180);
        }

        pic.addEventListener("mousemove", function(e) {
            pointToTilt(e.clientX, e.clientY);
        });

        pic.addEventListener("touchmove", function(e) {
            if (!e.touches || !e.touches[0]) return;
            pointToTilt(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        pic.addEventListener("mouseenter", function() {
            pic.classList.add("smooth-3d");
            shell.classList.add("is-interacting");
        });

        pic.addEventListener("mouseleave", resetTilt);
        pic.addEventListener("touchend", resetTilt);
        pic.addEventListener("blur", resetTilt);
        pic.addEventListener("focus", function() {
            pic.classList.add("smooth-3d");
            shell.classList.add("is-interacting");
        });
    }

    function setupMemberPhotoSequence() {
        var photo = document.querySelector(".about_person_area .person_img img");
        if (!photo) return;
        var shell = document.querySelector(".about_person_area .person_img");
        var badge = document.getElementById("photo-story-badge");

        var firstImpression = "img/member/member-photo-14.jpeg";
        var lowerFocusFrame = "img/member/member-photo-12.jpeg";
        var frameTags = {
            "img/member/member-photo-07.jpeg": "With Mom",
            "img/member/member-photo-05.jpg": "NeurIPS 2023",
            "img/member/member-photo-03.jpeg": "MSCS Graduate"
        };
        var frames = [
            "img/member/member-photo-01.jpeg",
            "img/member/member-photo-02.jpeg",
            "img/member/member-photo-03.jpeg",
            "img/member/member-photo-04.jpg",
            "img/member/member-photo-05.jpg",
            "img/member/member-photo-06.jpeg",
            "img/member/member-photo-07.jpeg",
            "img/member/member-photo-08.jpeg",
            "img/member/member-photo-11.jpg",
            "img/member/member-photo-12.jpeg",
            "img/member/member-photo-13.jpg",
            "img/member/member-photo-14.jpeg"
        ];

        // Preload frames so transitions stay smooth.
        frames.forEach(function(src) {
            var img = new Image();
            img.src = src;
        });

        var idx = frames.indexOf(firstImpression);
        if (idx < 0) idx = 0;
        var stepMs = 2100;

        function applyFrame(src) {
            if (!src) return;
            photo.src = src;
            photo.classList.remove("photo-frame-enter");
            // Force reflow for deterministic restart of transition animation.
            void photo.offsetWidth;
            photo.classList.add("photo-frame-enter");

            var tagText = frameTags[src] || "";
            if (shell) {
                shell.classList.toggle("is-tag-frame", !!tagText);
                shell.classList.toggle("is-lower-focus-frame", src === lowerFocusFrame);
            }

            if (badge) {
                if (tagText) {
                    badge.textContent = tagText;
                    badge.hidden = false;
                } else {
                    badge.hidden = true;
                }
            }
        }

        // First impression: always hold this frame for 2 seconds.
        applyFrame(firstImpression);

        window.setTimeout(function() {
            // Continue with the next frame and loop through all available photos.
            idx = (idx + 1) % frames.length;
            applyFrame(frames[idx]);

            window.setInterval(function() {
                idx = (idx + 1) % frames.length;
                applyFrame(frames[idx]);
            }, stepMs);
        }, 2000);
    }

    function initModernEnhancements() {
        setupDefaultVisualExperience();
        setupSectionChoreography();
        setupCardPointerGlow();
        setupScrollProgress();
        setupProjectFilter();
        setupContactReveal();
        setupAiBlueprintTabs();
        setupAiBlueprintInteractions();
        setupAboutFocusTypewriter();
        setupMemberPhotoSequence();
        setupProfilePic3DSmoothing();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initModernEnhancements);
    } else {
        initModernEnhancements();
    }
})();

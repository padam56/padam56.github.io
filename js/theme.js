;(function($) {
    "use strict";
  
    /*----------------------------------------------------*/
    /*  Menu scroll js
    /*----------------------------------------------------*/
    var nav_offset_top = $('.header_area').offset().top;
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
    
    // instance of fuction while Window Scroll event
	$(window).on('scroll', function () {	
		stickyHeader()
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
    
    
    $('.header_area .nav.navbar-nav li a[href^="#"]:not([href="#"])').on('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top - 80
        }, 1500);
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

    $(window).on('scroll', setActiveNav);
    
    
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
        $(window).on('load', function() { // makes sure the whole site is loaded
		$('#preloader_spinner').fadeOut(); // will first fade out the loading animation
		$('#preloader').delay(150).fadeOut('slow'); // will fade out the white DIV that covers the website.
		$('body').delay(150).css({'overflow':'visible'})
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
        window.dispatchEvent(new CustomEvent("visualmodechange", { detail: { mode: "network" } }));
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
        document.querySelectorAll(".service_item, .journey_card").forEach(function(card) {
            card.addEventListener("mousemove", function(evt) {
                var rect = card.getBoundingClientRect();
                var x = ((evt.clientX - rect.left) / rect.width) * 100;
                var y = ((evt.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty("--mx", x.toFixed(2) + "%");
                card.style.setProperty("--my", y.toFixed(2) + "%");
            });
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

    function setupProjectModal() {
        var modal = document.getElementById("project-modal");
        if (!modal) return;

        var title = modal.querySelector("[data-modal-title]");
        var desc = modal.querySelector("[data-modal-desc]");
        var tags = modal.querySelector("[data-modal-tags]");
        var closeBtn = modal.querySelector(".modern_modal_close");
        var backdrop = modal.querySelector(".modern_modal_backdrop");

        function openFromCard(card) {
            title.textContent = card.getAttribute("data-title") || "Project";
            desc.textContent = card.getAttribute("data-description") || "No details provided.";
            var list = (card.getAttribute("data-tags") || "").split(",").filter(Boolean);
            tags.innerHTML = list.map(function(tag) {
                return "<span>" + tag + "</span>";
            }).join("");
            modal.classList.add("is-open");
            document.body.style.overflow = "hidden";
        }

        function close() {
            modal.classList.remove("is-open");
            document.body.style.overflow = "";
        }

        document.querySelectorAll(".service_item[data-title]").forEach(function(card) {
            card.addEventListener("click", function() {
                openFromCard(card);
            });
            card.setAttribute("tabindex", "0");
            card.addEventListener("keydown", function(evt) {
                if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    openFromCard(card);
                }
            });
        });

        closeBtn.addEventListener("click", close);
        backdrop.addEventListener("click", close);
        document.addEventListener("keydown", function(evt) {
            if (evt.key === "Escape") close();
        });
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

    function setupAiBlueprintTabs() {
        var tabs = document.querySelectorAll(".ai_blueprint_tab");
        var panels = document.querySelectorAll(".ai_blueprint_panel");
        if (!tabs.length || !panels.length) return;

        function activate(view) {
            tabs.forEach(function(tab) {
                var isActive = tab.getAttribute("data-ai-view") === view;
                tab.classList.toggle("is-active", isActive);
                tab.setAttribute("aria-selected", String(isActive));
            });

            panels.forEach(function(panel) {
                var panelView = panel.id.replace("ai-view-", "");
                var isActive = panelView === view;
                panel.classList.toggle("is-active", isActive);
                panel.hidden = !isActive;
            });
        }

        tabs.forEach(function(tab) {
            tab.addEventListener("click", function() {
                activate(tab.getAttribute("data-ai-view"));
            });
        });

        var segCta = document.querySelector(".seg_lab_open_btn");
        if (segCta) {
            segCta.addEventListener("click", function() {
                activate("seg");
            });
        }

        var defaultTab = document.querySelector(".ai_blueprint_tab.is-active") || tabs[0];
        activate(defaultTab.getAttribute("data-ai-view"));
    }

    function setupAiBlueprintInteractions() {
        var stageCards = document.querySelectorAll(".ml_stage_card");
        var stageTitle = document.getElementById("ml-stage-title");
        var stageDetail = document.getElementById("ml-stage-detail");
        var stageArtifact = document.getElementById("ml-stage-artifact");

        function activateStage(card) {
            if (!card || !stageTitle || !stageDetail || !stageArtifact) return;
            stageCards.forEach(function(item) {
                item.classList.toggle("is-active", item === card);
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

        var flowToggle = document.getElementById("cv-flow-toggle");
        var pipeline = document.querySelector(".cv_pipeline_graph");
        if (flowToggle && pipeline) {
            flowToggle.addEventListener("click", function() {
                var active = pipeline.classList.toggle("is-flowing");
                flowToggle.classList.toggle("is-active", active);
                flowToggle.setAttribute("aria-pressed", String(active));
                flowToggle.textContent = active ? "Pause Signal Flow" : "Run Signal Flow";
            });
        }

        var lensButtons = document.querySelectorAll(".readiness_lens_btn");
        var readinessTable = document.querySelector(".readiness_matrix");
        if (lensButtons.length && readinessTable) {
            function applyLens(lens) {
                readinessTable.classList.remove("lens-all", "lens-research", "lens-production");
                readinessTable.classList.add("lens-" + lens);

                lensButtons.forEach(function(btn) {
                    var active = btn.getAttribute("data-readiness-lens") === lens;
                    btn.classList.toggle("is-active", active);
                    btn.setAttribute("aria-selected", String(active));
                });
            }

            lensButtons.forEach(function(btn) {
                btn.addEventListener("click", function() {
                    applyLens(btn.getAttribute("data-readiness-lens"));
                });
            });

            var defaultLens = document.querySelector(".readiness_lens_btn.is-active") || lensButtons[0];
            applyLens(defaultLens.getAttribute("data-readiness-lens"));
        }

        var playbookSteps = document.querySelectorAll(".playbook_step");
        var playbookTitle = document.getElementById("playbook-step-title");
        var playbookDetail = document.getElementById("playbook-step-detail");
        var playbookOutput = document.getElementById("playbook-step-output");

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

        setupSegmentationDemo();
    }

    function setupSegmentationDemo() {
        var canvas = document.getElementById("seg-demo-canvas");
        var image = document.getElementById("seg-demo-image");
        var semanticMaskImage = document.getElementById("seg-demo-mask-semantic");
        var instancePrimaryMaskImage = document.getElementById("seg-demo-mask-instance-primary");
        var instanceSecondaryMaskImage = document.getElementById("seg-demo-mask-instance-secondary");
        var instanceTertiaryMaskImage = document.getElementById("seg-demo-mask-instance-tertiary");
        var sensitivity = document.getElementById("seg-sensitivity");
        var opacity = document.getElementById("seg-opacity");
        var resetBtn = document.getElementById("seg-reset");
        var runBtn = document.getElementById("seg-run");
        var status = document.getElementById("seg-status");
        var modeDetail = document.getElementById("seg-mode-detail");
        var modeButtons = Array.prototype.slice.call(document.querySelectorAll(".seg_mode_btn"));

        if (!canvas || !image || !semanticMaskImage || !instancePrimaryMaskImage || !instanceSecondaryMaskImage || !instanceTertiaryMaskImage || !sensitivity || !opacity || !resetBtn || !runBtn || !status || !modeDetail || !modeButtons.length) return;

        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        var segMode = "semantic";
        var drawWidth = 0;
        var drawHeight = 0;
        var baseData = null;
        var modeMasks = {
            semantic: null,
            instancePrimary: null,
            instanceSecondary: null,
            instanceTertiary: null
        };
        var currentMask = null;
        var currentLabelMap = null;

        function setStatus(text) {
            status.textContent = text;
        }

        function copyMask(mask) {
            return mask ? new Uint8Array(mask) : null;
        }

        function buildMaskFromAsset(img) {
            if (!drawWidth || !drawHeight || !img.naturalWidth || !img.naturalHeight) return null;
            var maskCanvas = document.createElement("canvas");
            maskCanvas.width = drawWidth;
            maskCanvas.height = drawHeight;
            var maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
            if (!maskCtx) return null;

            maskCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
            var pixels = maskCtx.getImageData(0, 0, drawWidth, drawHeight).data;
            var binary = new Uint8Array(drawWidth * drawHeight);
            for (var i = 0; i < binary.length; i += 1) {
                var idx = i * 4;
                var luminance = pixels[idx] + pixels[idx + 1] + pixels[idx + 2];
                binary[i] = (pixels[idx + 3] > 10 && luminance > 24) ? 1 : 0;
            }
            return binary;
        }

        function buildModeMasksFromAssets() {
            modeMasks.semantic = buildMaskFromAsset(semanticMaskImage);
            modeMasks.instancePrimary = buildMaskFromAsset(instancePrimaryMaskImage);
            modeMasks.instanceSecondary = buildMaskFromAsset(instanceSecondaryMaskImage);
            modeMasks.instanceTertiary = buildMaskFromAsset(instanceTertiaryMaskImage);
        }

        function applyModeText() {
            if (segMode === "semantic") {
                modeDetail.textContent = "Semantic mode: one class for all objects combined.";
                return;
            }

            if (segMode === "instance") {
                modeDetail.textContent = "Instance mode: each object has its own ID and color.";
                return;
            }

            modeDetail.textContent = "Panoptic mode: objects plus background stuff classes (sky and floor).";
        }

        function panopticStuffLabelAt(index) {
            var y = Math.floor(index / drawWidth);
            return y < Math.floor(drawHeight * 0.66) ? 10 : 11;
        }

        function applySensitivityToThingMask(mask) {
            if (!mask || !mask.length) return mask;

            var level = parseInt(sensitivity.value, 10);
            if (level >= 65 && level <= 75) return new Uint8Array(mask);

            var out = new Uint8Array(mask.length);
            for (var y = 1; y < drawHeight - 1; y += 1) {
                for (var x = 1; x < drawWidth - 1; x += 1) {
                    var idx = y * drawWidth + x;
                    var votes = 0;
                    for (var oy = -1; oy <= 1; oy += 1) {
                        for (var ox = -1; ox <= 1; ox += 1) {
                            if (mask[(y + oy) * drawWidth + (x + ox)]) votes += 1;
                        }
                    }
                    if (level > 75) {
                        out[idx] = votes >= 3 ? 1 : 0;
                    } else {
                        out[idx] = votes >= 6 ? 1 : 0;
                    }
                }
            }
            return out;
        }

        function applyOverlay(mask, labelMap) {
            if (!baseData) return;
            var img = new ImageData(new Uint8ClampedArray(baseData.data), drawWidth, drawHeight);
            var alpha = parseInt(opacity.value, 10) / 100;

            if (segMode === "semantic" && mask) {
                for (var i = 0; i < mask.length; i += 1) {
                    if (!mask[i]) continue;
                    var idx = i * 4;
                    img.data[idx] = Math.round(img.data[idx] * (1 - alpha) + 34 * alpha);
                    img.data[idx + 1] = Math.round(img.data[idx + 1] * (1 - alpha) + 211 * alpha);
                    img.data[idx + 2] = Math.round(img.data[idx + 2] * (1 - alpha) + 238 * alpha);
                }
            }

            if ((segMode === "instance" || segMode === "panoptic") && labelMap) {
                for (var j = 0; j < labelMap.length; j += 1) {
                    var label = labelMap[j];
                    var jdx = j * 4;
                    if (label === 10) {
                        img.data[jdx] = Math.round(img.data[jdx] * (1 - alpha * 0.36) + 37 * alpha * 0.36);
                        img.data[jdx + 1] = Math.round(img.data[jdx + 1] * (1 - alpha * 0.36) + 99 * alpha * 0.36);
                        img.data[jdx + 2] = Math.round(img.data[jdx + 2] * (1 - alpha * 0.36) + 235 * alpha * 0.36);
                    }
                    if (label === 11) {
                        img.data[jdx] = Math.round(img.data[jdx] * (1 - alpha * 0.36) + 22 * alpha * 0.36);
                        img.data[jdx + 1] = Math.round(img.data[jdx + 1] * (1 - alpha * 0.36) + 163 * alpha * 0.36);
                        img.data[jdx + 2] = Math.round(img.data[jdx + 2] * (1 - alpha * 0.36) + 74 * alpha * 0.36);
                    }
                    if (label === 1) {
                        img.data[jdx] = Math.round(img.data[jdx] * (1 - alpha) + 34 * alpha);
                        img.data[jdx + 1] = Math.round(img.data[jdx + 1] * (1 - alpha) + 211 * alpha);
                        img.data[jdx + 2] = Math.round(img.data[jdx + 2] * (1 - alpha) + 238 * alpha);
                    }
                    if (label === 2) {
                        img.data[jdx] = Math.round(img.data[jdx] * (1 - alpha) + 236 * alpha);
                        img.data[jdx + 1] = Math.round(img.data[jdx + 1] * (1 - alpha) + 72 * alpha);
                        img.data[jdx + 2] = Math.round(img.data[jdx + 2] * (1 - alpha) + 153 * alpha);
                    }
                    if (label === 3) {
                        img.data[jdx] = Math.round(img.data[jdx] * (1 - alpha) + 245 * alpha);
                        img.data[jdx + 1] = Math.round(img.data[jdx + 1] * (1 - alpha) + 158 * alpha);
                        img.data[jdx + 2] = Math.round(img.data[jdx + 2] * (1 - alpha) + 11 * alpha);
                    }
                }
            }

            if (mask || labelMap) {
                for (var k = 0; k < drawWidth * drawHeight; k += 1) {
                    var x = k % drawWidth;
                    var y = Math.floor(k / drawWidth);
                    var left = x > 0 ? k - 1 : k;
                    var right = x < drawWidth - 1 ? k + 1 : k;
                    var up = y > 0 ? k - drawWidth : k;
                    var down = y < drawHeight - 1 ? k + drawWidth : k;
                    var self = labelMap ? labelMap[k] : (mask && mask[k] ? 1 : 0);
                    var lval = labelMap ? labelMap[left] : (mask && mask[left] ? 1 : 0);
                    var rval = labelMap ? labelMap[right] : (mask && mask[right] ? 1 : 0);
                    var uval = labelMap ? labelMap[up] : (mask && mask[up] ? 1 : 0);
                    var dval = labelMap ? labelMap[down] : (mask && mask[down] ? 1 : 0);
                    if (self !== lval || self !== rval || self !== uval || self !== dval) {
                        var odx = k * 4;
                        if (segMode === "semantic") {
                            img.data[odx] = 249;
                            img.data[odx + 1] = 115;
                            img.data[odx + 2] = 22;
                        } else if (segMode === "instance") {
                            img.data[odx] = 15;
                            img.data[odx + 1] = 23;
                            img.data[odx + 2] = 42;
                        } else {
                            img.data[odx] = 255;
                            img.data[odx + 1] = 255;
                            img.data[odx + 2] = 255;
                        }
                    }
                }
            }

            ctx.putImageData(img, 0, 0);
        }

        function drawBaseImage() {
            if (!baseData) return;
            ctx.putImageData(new ImageData(new Uint8ClampedArray(baseData.data), drawWidth, drawHeight), 0, 0);
        }

        function runSegmentation() {
            if (!drawWidth || !drawHeight) return;

            var labelMap = null;
            var thingMask = null;

            if (segMode === "semantic" && modeMasks.semantic) {
                thingMask = copyMask(modeMasks.semantic);
            }

            if ((segMode === "instance" || segMode === "panoptic") && modeMasks.instancePrimary && modeMasks.instanceSecondary && modeMasks.instanceTertiary) {
                labelMap = new Uint8Array(drawWidth * drawHeight);
                for (var i = 0; i < labelMap.length; i += 1) {
                    if (segMode === "panoptic") labelMap[i] = panopticStuffLabelAt(i);
                    else labelMap[i] = 0;

                    if (modeMasks.instancePrimary[i]) labelMap[i] = 1;
                    else if (modeMasks.instanceSecondary[i]) labelMap[i] = 2;
                    else if (modeMasks.instanceTertiary[i]) labelMap[i] = 3;
                }

                thingMask = new Uint8Array(labelMap.length);
                for (var m = 0; m < labelMap.length; m += 1) {
                    thingMask[m] = (labelMap[m] === 1 || labelMap[m] === 2 || labelMap[m] === 3) ? 1 : 0;
                }
            }

            if (thingMask) {
                var tuned = applySensitivityToThingMask(thingMask);
                if (labelMap) {
                    for (var l = 0; l < labelMap.length; l += 1) {
                        if (labelMap[l] === 1 || labelMap[l] === 2 || labelMap[l] === 3) {
                            if (!tuned[l]) {
                                labelMap[l] = segMode === "panoptic" ? panopticStuffLabelAt(l) : 0;
                            }
                        }
                    }
                }
                currentMask = tuned;
                currentLabelMap = labelMap;
            }

            applyOverlay(currentMask, currentLabelMap);

            if (segMode === "semantic") {
                setStatus("Semantic result: all objects are treated as one class.");
            } else if (segMode === "instance") {
                setStatus("Instance result: sphere, cylinder, and pyramid are shown as separate IDs.");
            } else {
                setStatus("Panoptic result: object instances plus sky/floor stuff are shown together.");
            }
        }

        function fitAndDrawImage() {
            if (!image.naturalWidth || !image.naturalHeight) return;

            var maxWidth = Math.min(760, Math.max(360, canvas.parentElement.clientWidth - 20));
            var ratio = image.naturalHeight / image.naturalWidth;
            drawWidth = Math.round(maxWidth);
            drawHeight = Math.round(maxWidth * ratio);

            canvas.width = drawWidth;
            canvas.height = drawHeight;

            ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
            baseData = ctx.getImageData(0, 0, drawWidth, drawHeight);
            buildModeMasksFromAssets();
            currentMask = null;
            currentLabelMap = null;
            drawBaseImage();
            applyModeText();
            setStatus("Ready. Choose a mode and click Run Segmentation.");
        }

        modeButtons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                segMode = btn.getAttribute("data-seg-mode") || "semantic";
                modeButtons.forEach(function(item) {
                    var active = item === btn;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-selected", String(active));
                });
                applyModeText();
                runSegmentation();
            });
        });

        runBtn.addEventListener("click", function() {
            runSegmentation();
        });

        resetBtn.addEventListener("click", function() {
            currentMask = null;
            currentLabelMap = null;
            drawBaseImage();
            setStatus("Reset complete. Choose a mode and run again.");
        });

        sensitivity.addEventListener("input", function() {
            if (currentMask) runSegmentation();
        });

        opacity.addEventListener("input", function() {
            if (currentMask || currentLabelMap) {
                applyOverlay(currentMask, currentLabelMap);
                return;
            }
            drawBaseImage();
        });

        image.addEventListener("load", fitAndDrawImage);

        function onMaskLoaded() {
            if (drawWidth && drawHeight) {
                buildModeMasksFromAssets();
            }
        }

        semanticMaskImage.addEventListener("load", onMaskLoaded);
        instancePrimaryMaskImage.addEventListener("load", onMaskLoaded);
        instanceSecondaryMaskImage.addEventListener("load", onMaskLoaded);
        instanceTertiaryMaskImage.addEventListener("load", onMaskLoaded);

        image.addEventListener("error", function() {
            setStatus("Segmentation image failed to load. Please refresh the page.");
        });

        function onMaskError() {
            setStatus("Mask asset failed to load. Please refresh the page.");
        }

        semanticMaskImage.addEventListener("error", onMaskError);
        instancePrimaryMaskImage.addEventListener("error", onMaskError);
        instanceSecondaryMaskImage.addEventListener("error", onMaskError);
        instanceTertiaryMaskImage.addEventListener("error", onMaskError);

        if (image.complete && image.naturalWidth) {
            fitAndDrawImage();
        }
        if (semanticMaskImage.complete && semanticMaskImage.naturalWidth && instancePrimaryMaskImage.complete && instancePrimaryMaskImage.naturalWidth && instanceSecondaryMaskImage.complete && instanceSecondaryMaskImage.naturalWidth && instanceTertiaryMaskImage.complete && instanceTertiaryMaskImage.naturalWidth) {
            buildModeMasksFromAssets();
        }

        window.addEventListener("resize", function() {
            if (image.complete && image.naturalWidth) {
                fitAndDrawImage();
            }
        }, { passive: true });
    }

    function initModernEnhancements() {
        setupDefaultVisualExperience();
        setupSectionChoreography();
        setupCardPointerGlow();
        setupScrollProgress();
        setupProjectFilter();
        setupProjectModal();
        setupContactReveal();
        setupAiBlueprintTabs();
        setupAiBlueprintInteractions();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initModernEnhancements);
    } else {
        initModernEnhancements();
    }
})();
;(function() {
    "use strict";
    function setupSegmentationDemo() {
        if (window.__segmentationLabInitialized) return;
        window.__segmentationLabInitialized = true;

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
        var subviewButtons = Array.prototype.slice.call(document.querySelectorAll(".seg_lab_sub_btn"));
        var subviewPanels = Array.prototype.slice.call(document.querySelectorAll(".seg_lab_subview"));

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
        var xaiInitialized = false;
        var augInitialized = false;
        var segModeCycle = ["semantic", "instance", "panoptic"];
        var segModeIndex = 0;
        var segModeAutoTimer = null;
        var segModeManualHoldUntil = 0;

        function applySegMode(mode, isManual) {
            segMode = mode || "semantic";
            segModeIndex = Math.max(0, segModeCycle.indexOf(segMode));

            modeButtons.forEach(function(item) {
                var active = item.getAttribute("data-seg-mode") === segMode;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
            });

            if (isManual) {
                segModeManualHoldUntil = Date.now() + 7000;
            }

            applyModeText();
            runLiveSegmentation();
        }

        function isSegSubviewActive() {
            var panel = document.getElementById("seg-lab-view-seg");
            return !!(panel && !panel.hidden && panel.classList.contains("is-active"));
        }

        function startSegModeAutoCycle() {
            if (segModeAutoTimer) return;

            segModeAutoTimer = window.setInterval(function() {
                if (document.hidden) return;
                if (!isSegSubviewActive()) return;
                if (Date.now() < segModeManualHoldUntil) return;

                segModeIndex = (segModeIndex + 1) % segModeCycle.length;
                applySegMode(segModeCycle[segModeIndex], false);
            }, 3600);
        }

        function instanceMasksReady() {
            return !!(modeMasks.instancePrimary && modeMasks.instanceSecondary && modeMasks.instanceTertiary);
        }

        function semanticMaskReady() {
            return !!modeMasks.semantic;
        }

        function runLiveSegmentation() {
            if (!drawWidth || !drawHeight || !baseData) {
                setStatus("Loading segmentation scene...");
                return;
            }

            if (segMode === "semantic" && !semanticMaskReady()) {
                drawBaseImage();
                setStatus("Loading semantic mask assets...");
                return;
            }

            if ((segMode === "instance" || segMode === "panoptic") && !instanceMasksReady()) {
                drawBaseImage();
                setStatus("Loading instance mask assets...");
                return;
            }

            runSegmentation();
        }

        function activateSubview(name) {
            if (!name || !subviewButtons.length || !subviewPanels.length) return;

            subviewButtons.forEach(function(btn) {
                var active = (btn.getAttribute("data-seg-lab-view") === name);
                btn.classList.toggle("is-active", active);
                btn.setAttribute("aria-selected", String(active));
            });

            subviewPanels.forEach(function(panel) {
                var active = panel.id === ("seg-lab-view-" + name);
                panel.classList.toggle("is-active", active);
                panel.hidden = !active;
            });

            if (name === "xai" && !xaiInitialized) {
                setupExplainabilityDemo();
                xaiInitialized = true;
            } else if (name === "xai") {
                var xaiMode = document.getElementById("xai-overlay-mode");
                if (xaiMode) xaiMode.dispatchEvent(new Event("change", { bubbles: true }));
            }
            if (name === "aug" && !augInitialized) {
                setupSyntheticBoosterDemo();
                augInitialized = true;
            } else if (name === "aug") {
                var augIntensity = document.getElementById("aug-intensity");
                if (augIntensity) augIntensity.dispatchEvent(new Event("input", { bubbles: true }));
                if (typeof window.__segAugResumeLive === "function") window.__segAugResumeLive();
            } else if (name === "seg") {
                runLiveSegmentation();
            }
        }

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
            setStatus("Ready. Live segmentation is active. Change controls to update instantly.");
            runLiveSegmentation();
        }

        modeButtons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                applySegMode(btn.getAttribute("data-seg-mode") || "semantic", true);
            });
        });

        subviewButtons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                activateSubview(btn.getAttribute("data-seg-lab-view"));
            });
        });

        runBtn.addEventListener("click", function() {
            runLiveSegmentation();
        });

        resetBtn.addEventListener("click", function() {
            currentMask = null;
            currentLabelMap = null;
            drawBaseImage();
            runLiveSegmentation();
        });

        sensitivity.addEventListener("input", function() {
            runLiveSegmentation();
        });

        opacity.addEventListener("input", function() {
            runLiveSegmentation();
        });

        image.addEventListener("load", fitAndDrawImage);

        function onMaskLoaded() {
            if (drawWidth && drawHeight) {
                buildModeMasksFromAssets();
                runLiveSegmentation();
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

        startSegModeAutoCycle();
        activateSubview("seg");
    }

    function setupExplainabilityDemo() {
        if (window.__xaiSegDemoInitialized) return;
        window.__xaiSegDemoInitialized = true;

        var canvas = document.getElementById("xai-demo-canvas");
        var sceneImage = document.getElementById("xai-demo-image");
        var modeSelect = document.getElementById("xai-overlay-mode");
        var toggleFailureBtn = document.getElementById("xai-toggle-failure");
        var status = document.getElementById("xai-status");
        var instanceMaskA = document.getElementById("seg-demo-mask-instance-primary");
        var instanceMaskB = document.getElementById("seg-demo-mask-instance-secondary");
        var instanceMaskC = document.getElementById("seg-demo-mask-instance-tertiary");
        if (!canvas || !sceneImage || !modeSelect || !toggleFailureBtn || !status) return;

        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        var failureOn = false;
        var w = 0;
        var h = 0;
        var cacheKey = "";
        var cachedObjects = [];
        var stressValue = 10;
        var stressDirection = 1;
        var modeCycle = ["mask-vs-gt", "gradcam", "attention", "boundary-error"];
        var modeIndex = 0;
        var manualModeHoldUntil = 0;

        function sceneRect() {
            return {
                x: 0,
                y: 0,
                w: w,
                h: h
            };
        }

        function sizeCanvas() {
            var wrap = canvas.parentElement;
            var width = Math.max(360, Math.min(760, (wrap && wrap.clientWidth ? wrap.clientWidth : 640) - 4));
            w = Math.round(width);
            h = Math.round(width * 0.58);
            canvas.width = w;
            canvas.height = h;
        }

        function clamp(v, min, max) {
            return Math.max(min, Math.min(max, v));
        }

        function drawHeatAt(x, y, radius, color, alpha) {
            var grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
            grad.addColorStop(0, "rgba(" + color + "," + alpha + ")");
            grad.addColorStop(1, "rgba(" + color + ",0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawSceneBase() {
            var rect = sceneRect();
            if (sceneImage.complete && sceneImage.naturalWidth) {
                ctx.drawImage(sceneImage, 0, 0, sceneImage.naturalWidth, sceneImage.naturalHeight, rect.x, rect.y, rect.w, rect.h);
                return;
            }

            ctx.fillStyle = "#334155";
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 14px Sora, sans-serif";
            ctx.fillText("SEGMENTATION SCENE", rect.x + rect.w * 0.25, rect.y + rect.h * 0.5);
        }

        function extractObjectFromMask(maskImg, rect, id) {
            if (!maskImg || !maskImg.complete || !maskImg.naturalWidth) return null;

            var off = document.createElement("canvas");
            off.width = rect.w;
            off.height = rect.h;
            var offCtx = off.getContext("2d", { willReadFrequently: true });
            if (!offCtx) return null;

            offCtx.drawImage(maskImg, 0, 0, maskImg.naturalWidth, maskImg.naturalHeight, 0, 0, rect.w, rect.h);
            var px = offCtx.getImageData(0, 0, rect.w, rect.h).data;

            var minX = rect.w;
            var minY = rect.h;
            var maxX = -1;
            var maxY = -1;
            var sx = 0;
            var sy = 0;
            var count = 0;

            for (var y = 0; y < rect.h; y += 1) {
                for (var x = 0; x < rect.w; x += 1) {
                    var idx = (y * rect.w + x) * 4;
                    var alpha = px[idx + 3];
                    var lum = px[idx] + px[idx + 1] + px[idx + 2];
                    if (alpha > 18 && lum > 30) {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                        sx += x;
                        sy += y;
                        count += 1;
                    }
                }
            }

            if (maxX < minX || maxY < minY || count < 20) return null;

            var bw = Math.max(12, maxX - minX + 1);
            var bh = Math.max(12, maxY - minY + 1);
            var cx = sx / count;
            var cy = sy / count;

            return {
                id: id,
                x: rect.x + minX,
                y: rect.y + minY,
                w: bw,
                h: bh,
                cx: rect.x + cx,
                cy: rect.y + cy
            };
        }

        function getObjects(rect) {
            var key = rect.w + "x" + rect.h;
            if (cacheKey === key && cachedObjects.length) return cachedObjects;

            var masks = [instanceMaskA, instanceMaskB, instanceMaskC];
            var objects = [];
            for (var i = 0; i < masks.length; i += 1) {
                var obj = extractObjectFromMask(masks[i], rect, i + 1);
                if (obj) objects.push(obj);
            }

            if (!objects.length) {
                objects.push({ id: 1, x: rect.x + rect.w * 0.2, y: rect.y + rect.h * 0.16, w: rect.w * 0.6, h: rect.h * 0.68, cx: rect.x + rect.w * 0.5, cy: rect.y + rect.h * 0.5 });
            }

            cacheKey = key;
            cachedObjects = objects;
            return objects;
        }

        function predictedBox(gt, idx, stress) {
            var stressNorm = stress / 35;
            var shiftBase = 3 + stressNorm * 14 + (failureOn ? 5 : 0);
            var dir = idx === 0 ? 1 : (idx === 1 ? -1 : 0.65);
            var px = gt.x + Math.round(shiftBase * dir);
            var py = gt.y + Math.round((shiftBase * 0.45) * (idx === 1 ? -1 : 1));
            var shrink = clamp(stressNorm * 0.16 + (failureOn && idx === 1 ? 0.1 : 0), 0, 0.28);
            var pw = Math.max(10, Math.round(gt.w * (1 - shrink)));
            var ph = Math.max(10, Math.round(gt.h * (1 - shrink * 0.85)));

            if (failureOn && idx === 2) {
                pw = Math.max(8, Math.round(pw * 0.72));
                ph = Math.max(8, Math.round(ph * 0.68));
                px += Math.round(6 + stressNorm * 5);
                py += Math.round(4 + stressNorm * 4);
            }

            return {
                x: px,
                y: py,
                w: pw,
                h: ph,
                cx: px + pw * 0.5,
                cy: py + ph * 0.5
            };
        }

        function boxIoU(a, b) {
            var ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
            var iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
            var inter = ix * iy;
            var union = a.w * a.h + b.w * b.h - inter;
            return union > 0 ? inter / union : 0;
        }

        function stepStress() {
            var step = failureOn ? 2.8 : 2.2;
            stressValue += stressDirection * step;
            if (stressValue >= 35) {
                stressValue = 35;
                stressDirection = -1;
            } else if (stressValue <= 2) {
                stressValue = 2;
                stressDirection = 1;
            }
        }

        function drawScene() {
            var stress = stressValue;
            var mode = modeSelect.value;
            var rect = sceneRect();
            var objects = getObjects(rect);
            var pulseT = Date.now() * 0.005;

            ctx.clearRect(0, 0, w, h);
            var bg = ctx.createLinearGradient(0, 0, w, h);
            bg.addColorStop(0, "#0b1324");
            bg.addColorStop(1, "#040816");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            drawSceneBase();

            var iouSum = 0;
            var minIou = 1;
            var edgeConf = Math.max(0.36, 0.95 - stress * 0.012 - (failureOn ? 0.12 : 0));

            objects.forEach(function(gt, index) {
                var pred = predictedBox(gt, index, stress);

                ctx.strokeStyle = "rgba(245, 158, 11, 0.96)";
                ctx.lineWidth = 2;
                ctx.strokeRect(gt.x, gt.y, gt.w, gt.h);

                ctx.strokeStyle = failureOn ? "rgba(244, 63, 94, 0.96)" : "rgba(14, 165, 164, 0.96)";
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(pred.x, pred.y, pred.w, pred.h);
                ctx.setLineDash([]);

                if (mode === "mask-vs-gt") {
                    ctx.fillStyle = "rgba(34, 211, 238, 0.16)";
                    ctx.fillRect(pred.x, pred.y, pred.w, pred.h);
                }

                if (mode === "gradcam") {
                    var pulse = 0.68 + 0.32 * Math.sin(pulseT + index * 0.95);
                    var camRadius = Math.max(28, Math.min(pred.w, pred.h) * (0.48 + 0.2 * pulse));
                    var camAlpha = 0.34 + 0.24 * pulse;
                    drawHeatAt(pred.cx, pred.cy, camRadius, index === 1 ? "239,68,68" : "249,115,22", camAlpha);
                }

                if (mode === "attention") {
                    var attPulse = 0.76 + 0.24 * Math.sin(pulseT * 0.85 + index * 0.7 + 1.4);
                    drawHeatAt(gt.cx, gt.cy, Math.max(26, Math.min(gt.w, gt.h) * (0.34 + 0.16 * attPulse)), "56,189,248", 0.34 + 0.16 * attPulse);
                    ctx.strokeStyle = "rgba(147, 197, 253, 0.46)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(gt.cx, gt.cy);
                    ctx.lineTo(pred.cx, pred.cy);
                    ctx.stroke();
                }

                if (mode === "boundary-error") {
                    var dx = Math.abs(pred.x - gt.x) + Math.abs((pred.x + pred.w) - (gt.x + gt.w));
                    var dy = Math.abs(pred.y - gt.y) + Math.abs((pred.y + pred.h) - (gt.y + gt.h));
                    var bError = clamp((dx + dy) / Math.max(1, gt.w + gt.h), 0, 1);
                    drawHeatAt(gt.x + gt.w, gt.y + gt.h, 22 + bError * 30, "244,63,94", 0.35 + bError * 0.35);
                }

                var iou = boxIoU(gt, pred);
                iouSum += iou;
                if (iou < minIou) minIou = iou;
            });

            var avgIou = iouSum / Math.max(1, objects.length);
            status.textContent = "Objects tracked: " + objects.length + " | Mean IoU: " + avgIou.toFixed(2) + " (worst " + minIou.toFixed(2) + ") | Edge confidence: " + edgeConf.toFixed(2) + " | Auto threshold stress: " + stress.toFixed(1) + "/35.";
        }

        toggleFailureBtn.addEventListener("click", function() {
            failureOn = !failureOn;
            toggleFailureBtn.textContent = failureOn ? "Remove Boundary Failure" : "Inject Boundary Failure";
            drawScene();
        });
        modeSelect.addEventListener("change", function() {
            manualModeHoldUntil = Date.now() + 5000;
            modeIndex = modeCycle.indexOf(modeSelect.value);
            if (modeIndex < 0) modeIndex = 0;
            drawScene();
        });
        window.addEventListener("resize", function() { sizeCanvas(); drawScene(); }, { passive: true });
        sceneImage.addEventListener("load", drawScene);
        [instanceMaskA, instanceMaskB, instanceMaskC].forEach(function(img) {
            if (img) img.addEventListener("load", function() {
                cacheKey = "";
                drawScene();
            });
        });

        sizeCanvas();
        drawScene();
        setInterval(function() {
            if (document.hidden) return;
            stepStress();
            drawScene();
        }, 120);
        setInterval(function() {
            if (document.hidden) return;
            if (Date.now() < manualModeHoldUntil) return;
            modeIndex = (modeIndex + 1) % modeCycle.length;
            modeSelect.value = modeCycle[modeIndex];
            drawScene();
        }, 2600);
    }

    function setupSyntheticBoosterDemo() {
        if (window.__augSegDemoInitialized) return;
        window.__augSegDemoInitialized = true;

        var canvas = document.getElementById("aug-demo-canvas");
        var sceneImage = document.getElementById("aug-demo-image");
        var condition = document.getElementById("aug-condition");
        var intensitySlider = document.getElementById("aug-intensity");
        var intensityValue = document.getElementById("aug-intensity-value");
        var randomize = document.getElementById("aug-randomize");
        var transformGallery = document.getElementById("aug-transform-gallery");
        var transformNote = document.getElementById("aug-transform-note");
        var status = document.getElementById("aug-status");
        var presetButtons = Array.prototype.slice.call(document.querySelectorAll(".aug_preset_btn"));
        var miouBase = document.getElementById("aug-miou-base");
        var miouBoost = document.getElementById("aug-miou-boost");
        var gain = document.getElementById("aug-gain");
        if (!canvas || !sceneImage || !condition || !intensitySlider || !intensityValue || !randomize || !transformGallery || !miouBase || !miouBoost || !gain) return;

        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        var w = 0;
        var h = 0;
        var selectedTransform = "RandomRain";
        var variationSeed = Math.floor(Math.random() * 1000000);
        var liveTimer = null;
        var liveModeOn = false;
        var autoIntensityDirection = 1;
        var liveTick = 0;

        var allAlbumentations = [
            "HorizontalFlip", "VerticalFlip", "RandomRotate90", "Rotate", "ShiftScaleRotate", "Affine", "Perspective",
            "RandomResizedCrop", "RandomCrop", "CenterCrop", "PadIfNeeded", "LongestMaxSize", "SmallestMaxSize",
            "GaussianBlur", "MotionBlur", "MedianBlur", "GaussNoise", "ISONoise", "MultiplicativeNoise",
            "CLAHE", "ColorJitter", "HueSaturationValue", "RandomBrightnessContrast", "RandomGamma", "ToGray",
            "ChannelShuffle", "RGBShift", "Sharpen", "Emboss", "Posterize", "Solarize", "Equalize",
            "RandomRain", "RandomSnow", "RandomFog", "RandomShadow", "RandomSunFlare", "CoarseDropout",
            "GridDropout", "Cutout", "ImageCompression", "Downscale", "ElasticTransform", "GridDistortion", "OpticalDistortion"
        ];

        var categoryMap = {
            geometry: ["HorizontalFlip", "VerticalFlip", "RandomRotate90", "Rotate", "ShiftScaleRotate", "Affine", "Perspective", "ElasticTransform", "GridDistortion", "OpticalDistortion"],
            crop: ["RandomResizedCrop", "RandomCrop", "CenterCrop", "PadIfNeeded", "LongestMaxSize", "SmallestMaxSize"],
            blur: ["GaussianBlur", "MotionBlur", "MedianBlur", "Downscale", "ImageCompression"],
            noise: ["GaussNoise", "ISONoise", "MultiplicativeNoise"],
            color: ["CLAHE", "ColorJitter", "HueSaturationValue", "RandomBrightnessContrast", "RandomGamma", "ToGray", "ChannelShuffle", "RGBShift", "Sharpen", "Emboss", "Posterize", "Solarize", "Equalize"],
            weather: ["RandomRain", "RandomSnow", "RandomFog", "RandomShadow", "RandomSunFlare"],
            dropout: ["CoarseDropout", "GridDropout", "Cutout"]
        };

        function getCategory(name) {
            var keys = Object.keys(categoryMap);
            for (var i = 0; i < keys.length; i += 1) {
                if (categoryMap[keys[i]].indexOf(name) !== -1) return keys[i];
            }
            return "misc";
        }

        function categoryLabel(key) {
            if (key === "geometry") return "Geometry";
            if (key === "crop") return "Crop/Scale";
            if (key === "blur") return "Blur/Compression";
            if (key === "noise") return "Noise";
            if (key === "color") return "Color/Tone";
            if (key === "weather") return "Weather";
            if (key === "dropout") return "Dropout";
            return "General";
        }

        function makeRng(seed) {
            var s = (seed >>> 0) || 1;
            return function() {
                s = (s * 1664525 + 1013904223) >>> 0;
                return s / 4294967296;
            };
        }

        function clamp(v, min, max) {
            return Math.max(min, Math.min(max, v));
        }

        function createSurface(width, height) {
            var c = document.createElement("canvas");
            c.width = Math.max(1, Math.round(width));
            c.height = Math.max(1, Math.round(height));
            return c;
        }

        function copySurface(input) {
            var out = createSurface(input.width, input.height);
            var outCtx = out.getContext("2d", { willReadFrequently: true });
            outCtx.drawImage(input, 0, 0);
            return out;
        }

        function drawImageCover(targetCtx, img, width, height) {
            if (!img.naturalWidth || !img.naturalHeight) return;
            var srcRatio = img.naturalWidth / img.naturalHeight;
            var dstRatio = width / height;

            var sx = 0;
            var sy = 0;
            var sw = img.naturalWidth;
            var sh = img.naturalHeight;

            if (srcRatio > dstRatio) {
                sw = Math.round(sh * dstRatio);
                sx = Math.round((img.naturalWidth - sw) * 0.5);
            } else {
                sh = Math.round(sw / dstRatio);
                sy = Math.round((img.naturalHeight - sh) * 0.5);
            }

            targetCtx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        }

        function sceneRect() {
            return {
                x: 0,
                y: 0,
                width: w,
                height: h
            };
        }

        function sizeCanvas() {
            var wrap = canvas.parentElement;
            var width = Math.max(360, Math.min(760, (wrap && wrap.clientWidth ? wrap.clientWidth : 640) - 4));
            w = Math.round(width);
            h = Math.round(width * 0.58);
            canvas.width = w;
            canvas.height = h;
        }

        function drawBackdrop() {
            var bg = ctx.createLinearGradient(0, 0, w, h);
            bg.addColorStop(0, "#0f172a");
            bg.addColorStop(1, "#1e293b");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);
        }

        function drawFallbackPatch(targetCtx, width, height) {
            targetCtx.fillStyle = "#334155";
            targetCtx.fillRect(0, 0, width, height);
            targetCtx.fillStyle = "#cbd5e1";
            targetCtx.font = "bold 14px Sora, sans-serif";
            targetCtx.fillText("SEGMENTATION SCENE", Math.round(width * 0.28), Math.round(height * 0.52));
        }

        function withPixels(surface, callback) {
            var pctx = surface.getContext("2d", { willReadFrequently: true });
            var img = pctx.getImageData(0, 0, surface.width, surface.height);
            callback(img.data, surface.width, surface.height);
            pctx.putImageData(img, 0, 0);
        }

        function convolve(surface, kernel, divisor, bias) {
            var srcCtx = surface.getContext("2d", { willReadFrequently: true });
            var src = srcCtx.getImageData(0, 0, surface.width, surface.height);
            var out = srcCtx.createImageData(surface.width, surface.height);
            var sw = surface.width;
            var sh = surface.height;
            var d = src.data;
            var o = out.data;
            var div = divisor || 1;
            var b = bias || 0;
            for (var y = 1; y < sh - 1; y += 1) {
                for (var x = 1; x < sw - 1; x += 1) {
                    var r = 0, g = 0, bl = 0;
                    var ki = 0;
                    for (var ky = -1; ky <= 1; ky += 1) {
                        for (var kx = -1; kx <= 1; kx += 1) {
                            var idx = ((y + ky) * sw + (x + kx)) * 4;
                            var kval = kernel[ki++];
                            r += d[idx] * kval;
                            g += d[idx + 1] * kval;
                            bl += d[idx + 2] * kval;
                        }
                    }
                    var outIdx = (y * sw + x) * 4;
                    o[outIdx] = clamp(Math.round(r / div + b), 0, 255);
                    o[outIdx + 1] = clamp(Math.round(g / div + b), 0, 255);
                    o[outIdx + 2] = clamp(Math.round(bl / div + b), 0, 255);
                    o[outIdx + 3] = d[outIdx + 3];
                }
            }
            srcCtx.putImageData(out, 0, 0);
        }

        function transformPatch(source, kind, intensity, rand) {
            var patchW = source.width;
            var patchH = source.height;
            var out = createSurface(patchW, patchH);
            var octx = out.getContext("2d", { willReadFrequently: true });

            function resetFromSource() {
                octx.setTransform(1, 0, 0, 1, 0, 0);
                octx.filter = "none";
                octx.globalAlpha = 1;
                octx.clearRect(0, 0, patchW, patchH);
                octx.drawImage(source, 0, 0);
            }

            function fillBackground() {
                octx.fillStyle = "#0b1528";
                octx.fillRect(0, 0, patchW, patchH);
            }

            resetFromSource();

            if (kind === "HorizontalFlip") {
                fillBackground();
                octx.save();
                octx.translate(patchW, 0);
                octx.scale(-1, 1);
                octx.drawImage(source, 0, 0);
                octx.restore();
            } else if (kind === "VerticalFlip") {
                fillBackground();
                octx.save();
                octx.translate(0, patchH);
                octx.scale(1, -1);
                octx.drawImage(source, 0, 0);
                octx.restore();
            } else if (kind === "RandomRotate90") {
                fillBackground();
                var steps = Math.floor(rand() * 4);
                octx.save();
                octx.translate(patchW * 0.5, patchH * 0.5);
                octx.rotate((Math.PI / 2) * steps);
                octx.drawImage(source, -patchW * 0.5, -patchH * 0.5);
                octx.restore();
            } else if (kind === "Rotate" || kind === "ShiftScaleRotate" || kind === "Affine") {
                fillBackground();
                var maxAngle = kind === "Rotate" ? 18 : 22;
                var angle = ((rand() * 2 - 1) * maxAngle * intensity) * Math.PI / 180;
                var scale = kind === "Rotate" ? 1 : (1 + (rand() * 0.24 - 0.12) * intensity);
                var tx = kind === "ShiftScaleRotate" ? (rand() * 2 - 1) * patchW * 0.08 * intensity : 0;
                var ty = kind === "ShiftScaleRotate" ? (rand() * 2 - 1) * patchH * 0.08 * intensity : 0;
                var shx = kind === "Affine" ? (rand() * 2 - 1) * 0.18 * intensity : 0;
                var shy = kind === "Affine" ? (rand() * 2 - 1) * 0.18 * intensity : 0;
                octx.save();
                octx.translate(patchW * 0.5 + tx, patchH * 0.5 + ty);
                octx.rotate(angle);
                octx.transform(1, shy, shx, 1, 0, 0);
                octx.scale(scale, scale);
                octx.drawImage(source, -patchW * 0.5, -patchH * 0.5);
                octx.restore();
            } else if (kind === "Perspective") {
                fillBackground();
                var inset = Math.round(Math.min(patchW, patchH) * 0.13 * intensity);
                octx.save();
                octx.beginPath();
                octx.moveTo(inset, Math.round(rand() * inset));
                octx.lineTo(patchW - Math.round(rand() * inset), inset);
                octx.lineTo(patchW - inset, patchH - Math.round(rand() * inset));
                octx.lineTo(Math.round(rand() * inset), patchH - inset);
                octx.closePath();
                octx.clip();
                octx.transform(1, (rand() * 2 - 1) * 0.16 * intensity, (rand() * 2 - 1) * 0.16 * intensity, 1, 0, 0);
                octx.drawImage(source, 0, 0);
                octx.restore();
            } else if (kind === "RandomResizedCrop" || kind === "RandomCrop" || kind === "CenterCrop") {
                fillBackground();
                var cropScale = kind === "CenterCrop" ? 0.78 : (kind === "RandomCrop" ? (0.72 + rand() * 0.18) : (0.62 + rand() * 0.28));
                cropScale = clamp(cropScale + (intensity - 0.5) * 0.08, 0.58, 0.92);
                var cw = Math.max(24, Math.round(patchW * cropScale));
                var ch = Math.max(24, Math.round(patchH * cropScale));
                var cx = kind === "CenterCrop" ? Math.round((patchW - cw) * 0.5) : Math.round(rand() * (patchW - cw));
                var cy = kind === "CenterCrop" ? Math.round((patchH - ch) * 0.5) : Math.round(rand() * (patchH - ch));
                octx.drawImage(source, cx, cy, cw, ch, 0, 0, patchW, patchH);
            } else if (kind === "PadIfNeeded" || kind === "LongestMaxSize" || kind === "SmallestMaxSize") {
                fillBackground();
                var ratio = source.width / Math.max(1, source.height);
                var dstW = patchW;
                var dstH = patchH;
                if (kind === "LongestMaxSize") {
                    if (ratio >= 1) {
                        dstW = patchW;
                        dstH = Math.round(patchW / ratio * 0.88);
                    } else {
                        dstH = patchH;
                        dstW = Math.round(patchH * ratio * 0.88);
                    }
                } else if (kind === "PadIfNeeded") {
                    dstW = Math.round(patchW * 0.82);
                    dstH = Math.round(patchH * 0.82);
                } else {
                    if (ratio >= 1) {
                        dstH = patchH;
                        dstW = Math.round(patchH * ratio * 1.06);
                    } else {
                        dstW = patchW;
                        dstH = Math.round(patchW / ratio * 1.06);
                    }
                }
                var dx = Math.round((patchW - dstW) * 0.5);
                var dy = Math.round((patchH - dstH) * 0.5);
                octx.fillStyle = "rgba(30, 41, 59, 0.88)";
                octx.fillRect(0, 0, patchW, patchH);
                octx.drawImage(source, dx, dy, dstW, dstH);
            } else if (kind === "GaussianBlur") {
                octx.filter = "blur(" + (1.2 + intensity * 2.8).toFixed(2) + "px)";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
            } else if (kind === "MotionBlur") {
                fillBackground();
                var passes = 5 + Math.round(intensity * 7);
                for (var m = 0; m < passes; m += 1) {
                    var alpha = (1 / passes) * 1.2;
                    octx.globalAlpha = alpha;
                    octx.drawImage(source, m * 1.4, m * 0.35);
                }
                octx.globalAlpha = 1;
            } else if (kind === "MedianBlur") {
                octx.filter = "blur(" + (0.9 + intensity * 1.7).toFixed(2) + "px)";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
                convolve(out, [0, -1, 0, -1, 6, -1, 0, -1, 0], 2, 0);
            } else if (kind === "GaussNoise" || kind === "ISONoise" || kind === "MultiplicativeNoise") {
                withPixels(out, function(data) {
                    for (var i = 0; i < data.length; i += 4) {
                        var n;
                        if (kind === "GaussNoise") {
                            n = (rand() + rand() + rand() - 1.5) * 46 * intensity;
                            data[i] = clamp(data[i] + n, 0, 255);
                            data[i + 1] = clamp(data[i + 1] + n, 0, 255);
                            data[i + 2] = clamp(data[i + 2] + n, 0, 255);
                        } else if (kind === "ISONoise") {
                            var iso = (rand() * 2 - 1) * 34 * intensity;
                            data[i] = clamp(data[i] + iso * 1.2, 0, 255);
                            data[i + 1] = clamp(data[i + 1] + iso * 0.9, 0, 255);
                            data[i + 2] = clamp(data[i + 2] + iso * 0.6, 0, 255);
                        } else {
                            var mul = 1 + (rand() * 2 - 1) * 0.25 * intensity;
                            data[i] = clamp(data[i] * mul, 0, 255);
                            data[i + 1] = clamp(data[i + 1] * mul, 0, 255);
                            data[i + 2] = clamp(data[i + 2] * mul, 0, 255);
                        }
                    }
                });
            } else if (kind === "CLAHE") {
                octx.filter = "contrast(" + (1.18 + intensity * 0.28).toFixed(2) + ")";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
                convolve(out, [0, -1, 0, -1, 5, -1, 0, -1, 0], 1, 0);
            } else if (kind === "ColorJitter") {
                octx.filter = "brightness(" + (0.9 + rand() * 0.45 * intensity).toFixed(2) + ") saturate(" + (0.8 + rand() * 0.8 * intensity).toFixed(2) + ") contrast(" + (0.9 + rand() * 0.45 * intensity).toFixed(2) + ")";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
            } else if (kind === "HueSaturationValue") {
                var hue = Math.round((rand() * 2 - 1) * 44 * intensity);
                var sat = (0.8 + rand() * 0.75 * intensity).toFixed(2);
                octx.filter = "hue-rotate(" + hue + "deg) saturate(" + sat + ")";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
            } else if (kind === "RandomBrightnessContrast") {
                var b = (0.85 + rand() * 0.55 * intensity).toFixed(2);
                var c = (0.85 + rand() * 0.65 * intensity).toFixed(2);
                octx.filter = "brightness(" + b + ") contrast(" + c + ")";
                octx.drawImage(source, 0, 0);
                octx.filter = "none";
            } else if (kind === "RandomGamma") {
                var gamma = 0.7 + rand() * 0.9 * intensity;
                withPixels(out, function(data) {
                    for (var g = 0; g < data.length; g += 4) {
                        data[g] = clamp(Math.pow(data[g] / 255, gamma) * 255, 0, 255);
                        data[g + 1] = clamp(Math.pow(data[g + 1] / 255, gamma) * 255, 0, 255);
                        data[g + 2] = clamp(Math.pow(data[g + 2] / 255, gamma) * 255, 0, 255);
                    }
                });
            } else if (kind === "ToGray") {
                withPixels(out, function(data) {
                    for (var tg = 0; tg < data.length; tg += 4) {
                        var gray = Math.round(data[tg] * 0.299 + data[tg + 1] * 0.587 + data[tg + 2] * 0.114);
                        data[tg] = gray;
                        data[tg + 1] = gray;
                        data[tg + 2] = gray;
                    }
                });
            } else if (kind === "ChannelShuffle") {
                var orders = [
                    [0, 2, 1], [1, 0, 2], [1, 2, 0],
                    [2, 0, 1], [2, 1, 0]
                ];
                var order = orders[Math.floor(rand() * orders.length)];
                withPixels(out, function(data) {
                    for (var cs = 0; cs < data.length; cs += 4) {
                        var r = data[cs], gch = data[cs + 1], bl = data[cs + 2];
                        var src = [r, gch, bl];
                        data[cs] = src[order[0]];
                        data[cs + 1] = src[order[1]];
                        data[cs + 2] = src[order[2]];
                    }
                });
            } else if (kind === "RGBShift") {
                withPixels(out, function(data) {
                    var rs = (rand() * 2 - 1) * 40 * intensity;
                    var gs = (rand() * 2 - 1) * 30 * intensity;
                    var bs = (rand() * 2 - 1) * 40 * intensity;
                    for (var sh = 0; sh < data.length; sh += 4) {
                        data[sh] = clamp(data[sh] + rs, 0, 255);
                        data[sh + 1] = clamp(data[sh + 1] + gs, 0, 255);
                        data[sh + 2] = clamp(data[sh + 2] + bs, 0, 255);
                    }
                });
            } else if (kind === "Sharpen") {
                convolve(out, [0, -1, 0, -1, 6, -1, 0, -1, 0], 2, 0);
            } else if (kind === "Emboss") {
                convolve(out, [-2, -1, 0, -1, 1, 1, 0, 1, 2], 1, 128 * intensity);
            } else if (kind === "Posterize") {
                var levels = 4 + Math.max(1, Math.round((1 - intensity) * 8));
                withPixels(out, function(data) {
                    for (var po = 0; po < data.length; po += 4) {
                        data[po] = Math.round(data[po] / levels) * levels;
                        data[po + 1] = Math.round(data[po + 1] / levels) * levels;
                        data[po + 2] = Math.round(data[po + 2] / levels) * levels;
                    }
                });
            } else if (kind === "Solarize") {
                var threshold = 170 - intensity * 60;
                withPixels(out, function(data) {
                    for (var so = 0; so < data.length; so += 4) {
                        if (data[so] > threshold) data[so] = 255 - data[so];
                        if (data[so + 1] > threshold) data[so + 1] = 255 - data[so + 1];
                        if (data[so + 2] > threshold) data[so + 2] = 255 - data[so + 2];
                    }
                });
            } else if (kind === "Equalize") {
                withPixels(out, function(data) {
                    var bins = new Array(256).fill(0);
                    for (var e = 0; e < data.length; e += 4) {
                        var lum = Math.round(0.299 * data[e] + 0.587 * data[e + 1] + 0.114 * data[e + 2]);
                        bins[lum] += 1;
                    }
                    var cdf = new Array(256);
                    var acc = 0;
                    for (var ci = 0; ci < 256; ci += 1) {
                        acc += bins[ci];
                        cdf[ci] = acc;
                    }
                    var minCdf = 0;
                    for (ci = 0; ci < 256; ci += 1) {
                        if (cdf[ci] > 0) {
                            minCdf = cdf[ci];
                            break;
                        }
                    }
                    var total = (data.length / 4);
                    for (var ep = 0; ep < data.length; ep += 4) {
                        var l = Math.round(0.299 * data[ep] + 0.587 * data[ep + 1] + 0.114 * data[ep + 2]);
                        var mapped = clamp(Math.round((cdf[l] - minCdf) / Math.max(1, total - minCdf) * 255), 0, 255);
                        var scale = mapped / Math.max(1, l);
                        data[ep] = clamp(data[ep] * scale, 0, 255);
                        data[ep + 1] = clamp(data[ep + 1] * scale, 0, 255);
                        data[ep + 2] = clamp(data[ep + 2] * scale, 0, 255);
                    }
                });
            } else if (kind === "RandomRain") {
                for (var r = 0; r < 120 + Math.round(intensity * 130); r += 1) {
                    var rx = rand() * patchW;
                    var ry = rand() * patchH;
                    var len = 10 + rand() * 14;
                    octx.strokeStyle = "rgba(180, 210, 255, 0.28)";
                    octx.lineWidth = 1;
                    octx.beginPath();
                    octx.moveTo(rx, ry);
                    octx.lineTo(rx - 4 - intensity * 5, ry + len);
                    octx.stroke();
                }
            } else if (kind === "RandomSnow") {
                octx.fillStyle = "rgba(241, 245, 249, " + (0.08 + intensity * 0.16).toFixed(2) + ")";
                octx.fillRect(0, 0, patchW, patchH);
                for (var sn = 0; sn < 140 + Math.round(intensity * 160); sn += 1) {
                    var sx = rand() * patchW;
                    var sy = rand() * patchH;
                    var sr = 0.6 + rand() * 1.9;
                    octx.fillStyle = "rgba(255,255,255," + (0.35 + rand() * 0.45).toFixed(2) + ")";
                    octx.beginPath();
                    octx.arc(sx, sy, sr, 0, Math.PI * 2);
                    octx.fill();
                }
            } else if (kind === "RandomFog") {
                var fogGrad = octx.createLinearGradient(0, 0, patchW, patchH);
                fogGrad.addColorStop(0, "rgba(226, 232, 240, " + (0.1 + intensity * 0.12).toFixed(2) + ")");
                fogGrad.addColorStop(1, "rgba(226, 232, 240, " + (0.2 + intensity * 0.2).toFixed(2) + ")");
                octx.fillStyle = fogGrad;
                octx.fillRect(0, 0, patchW, patchH);
            } else if (kind === "RandomShadow") {
                octx.fillStyle = "rgba(2, 6, 23, " + (0.22 + intensity * 0.34).toFixed(2) + ")";
                octx.beginPath();
                octx.moveTo(rand() * patchW * 0.25, rand() * patchH * 0.35);
                octx.lineTo(patchW * (0.55 + rand() * 0.3), patchH * (0.12 + rand() * 0.2));
                octx.lineTo(patchW * (0.52 + rand() * 0.3), patchH * (0.65 + rand() * 0.25));
                octx.lineTo(patchW * (0.08 + rand() * 0.25), patchH * (0.74 + rand() * 0.2));
                octx.closePath();
                octx.fill();
            } else if (kind === "RandomSunFlare") {
                var flareX = patchW * (0.15 + rand() * 0.7);
                var flareY = patchH * (0.08 + rand() * 0.25);
                var flare = octx.createRadialGradient(flareX, flareY, 2, flareX, flareY, patchW * (0.18 + intensity * 0.18));
                flare.addColorStop(0, "rgba(255, 248, 190, 0.72)");
                flare.addColorStop(1, "rgba(255, 248, 190, 0)");
                octx.fillStyle = flare;
                octx.fillRect(0, 0, patchW, patchH);
            } else if (kind === "CoarseDropout" || kind === "Cutout") {
                var holes = 14 + Math.round(intensity * 20);
                for (var co = 0; co < holes; co += 1) {
                    var hw = Math.round(8 + rand() * patchW * 0.12);
                    var hh = Math.round(8 + rand() * patchH * 0.12);
                    var hx = Math.round(rand() * Math.max(1, patchW - hw));
                    var hy = Math.round(rand() * Math.max(1, patchH - hh));
                    octx.fillStyle = kind === "Cutout" ? "rgba(15, 23, 42, 0.88)" : "rgba(12, 20, 36, 0.74)";
                    octx.fillRect(hx, hy, hw, hh);
                }
            } else if (kind === "GridDropout") {
                var cell = Math.max(12, Math.round(Math.min(patchW, patchH) * 0.08));
                octx.fillStyle = "rgba(15, 23, 42, 0.82)";
                for (var gy = 0; gy < patchH; gy += cell) {
                    for (var gx = 0; gx < patchW; gx += cell) {
                        if (rand() > 0.54) {
                            octx.fillRect(gx, gy, Math.round(cell * 0.62), Math.round(cell * 0.62));
                        }
                    }
                }
            } else if (kind === "ImageCompression") {
                var block = Math.max(4, Math.round(10 - intensity * 5));
                withPixels(out, function(data, pw, ph) {
                    for (var by = 0; by < ph; by += block) {
                        for (var bx = 0; bx < pw; bx += block) {
                            var sr = 0, sg = 0, sb = 0, count = 0;
                            for (var yy = by; yy < Math.min(ph, by + block); yy += 1) {
                                for (var xx = bx; xx < Math.min(pw, bx + block); xx += 1) {
                                    var id = (yy * pw + xx) * 4;
                                    sr += data[id];
                                    sg += data[id + 1];
                                    sb += data[id + 2];
                                    count += 1;
                                }
                            }
                            var rr = sr / Math.max(1, count);
                            var gg = sg / Math.max(1, count);
                            var bb = sb / Math.max(1, count);
                            for (yy = by; yy < Math.min(ph, by + block); yy += 1) {
                                for (xx = bx; xx < Math.min(pw, bx + block); xx += 1) {
                                    id = (yy * pw + xx) * 4;
                                    data[id] = clamp(rr + (rand() * 2 - 1) * 7, 0, 255);
                                    data[id + 1] = clamp(gg + (rand() * 2 - 1) * 7, 0, 255);
                                    data[id + 2] = clamp(bb + (rand() * 2 - 1) * 7, 0, 255);
                                }
                            }
                        }
                    }
                });
            } else if (kind === "Downscale") {
                var scale = 0.36 + (1 - intensity) * 0.28;
                var tiny = createSurface(Math.max(16, Math.round(patchW * scale)), Math.max(16, Math.round(patchH * scale)));
                var tctx = tiny.getContext("2d", { willReadFrequently: true });
                tctx.imageSmoothingEnabled = true;
                tctx.drawImage(source, 0, 0, tiny.width, tiny.height);
                octx.imageSmoothingEnabled = false;
                octx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, patchW, patchH);
                octx.imageSmoothingEnabled = true;
            } else if (kind === "ElasticTransform") {
                fillBackground();
                var amp = 3 + intensity * 8;
                var freq = 0.05 + intensity * 0.05;
                for (var ex = 0; ex < patchW; ex += 2) {
                    var yOffset = Math.sin(ex * freq + rand() * 6.28) * amp;
                    octx.drawImage(source, ex, 0, 2, patchH, ex, yOffset, 2, patchH);
                }
            } else if (kind === "GridDistortion") {
                fillBackground();
                var grid = 6;
                var cellW = patchW / grid;
                var cellH = patchH / grid;
                for (var gyc = 0; gyc < grid; gyc += 1) {
                    for (var gxc = 0; gxc < grid; gxc += 1) {
                        var sx0 = Math.round(gxc * cellW);
                        var sy0 = Math.round(gyc * cellH);
                        var sw0 = Math.round(cellW + 1);
                        var sh0 = Math.round(cellH + 1);
                        var dx0 = sx0 + Math.round((rand() * 2 - 1) * cellW * 0.18 * intensity);
                        var dy0 = sy0 + Math.round((rand() * 2 - 1) * cellH * 0.18 * intensity);
                        octx.drawImage(source, sx0, sy0, sw0, sh0, dx0, dy0, sw0, sh0);
                    }
                }
            } else if (kind === "OpticalDistortion") {
                fillBackground();
                octx.save();
                var zoom = 1 + intensity * 0.12;
                octx.translate(patchW * 0.5, patchH * 0.5);
                octx.scale(zoom, zoom);
                octx.drawImage(source, -patchW * 0.5, -patchH * 0.5);
                octx.restore();
                var vignette = octx.createRadialGradient(patchW * 0.5, patchH * 0.5, patchW * 0.22, patchW * 0.5, patchH * 0.5, patchW * 0.62);
                vignette.addColorStop(0, "rgba(0,0,0,0)");
                vignette.addColorStop(1, "rgba(0,0,0," + (0.18 + intensity * 0.22).toFixed(2) + ")");
                octx.fillStyle = vignette;
                octx.fillRect(0, 0, patchW, patchH);
            }

            return out;
        }

        function transformDescription(name) {
            var descriptions = {
                HorizontalFlip: "Mirror the scene left-right.",
                VerticalFlip: "Flip top-bottom to challenge orientation assumptions.",
                RandomRotate90: "Rotate by random 90-degree steps.",
                Rotate: "Small random rotation around scene center.",
                ShiftScaleRotate: "Shift, scale, and rotate jointly.",
                Affine: "Apply shear-style geometric warp.",
                Perspective: "Simulate perspective tilt and camera angle shift.",
                RandomResizedCrop: "Crop random region then resize to full patch.",
                RandomCrop: "Random local crop resized back to input dimensions.",
                CenterCrop: "Center-focused crop and resize.",
                PadIfNeeded: "Shrink and pad to keep context around objects.",
                LongestMaxSize: "Scale while preserving longest side constraints.",
                SmallestMaxSize: "Scale until shortest side reaches target, then crop.",
                GaussianBlur: "Gaussian smoothing for focus or motion softness.",
                MotionBlur: "Directional blur for camera/object motion.",
                MedianBlur: "Edge-preserving blur for impulse-noise suppression.",
                GaussNoise: "Add zero-mean sensor-like Gaussian noise.",
                ISONoise: "Camera-ISO style chroma and luminance noise.",
                MultiplicativeNoise: "Scale pixel intensities by random multiplicative factors.",
                CLAHE: "Boost local contrast in low-contrast regions.",
                ColorJitter: "Random brightness/contrast/saturation adjustment.",
                HueSaturationValue: "Color wheel and saturation perturbation.",
                RandomBrightnessContrast: "Joint brightness and contrast randomization.",
                RandomGamma: "Nonlinear gamma tone remapping.",
                ToGray: "Convert RGB scene into grayscale.",
                ChannelShuffle: "Permute color channels.",
                RGBShift: "Shift R/G/B channels independently.",
                Sharpen: "Enhance local edges and fine details.",
                Emboss: "Relief-like directional edge emphasis.",
                Posterize: "Reduce tonal bit-depth.",
                Solarize: "Invert high-intensity pixels.",
                Equalize: "Histogram equalization for global contrast spread.",
                RandomRain: "Synthetic rain streak overlay.",
                RandomSnow: "Snow particles and brightness veil.",
                RandomFog: "Hazy atmospheric fog overlay.",
                RandomShadow: "Polygonal dark shadow overlay.",
                RandomSunFlare: "Lens flare and bright hotspot.",
                CoarseDropout: "Large random occlusion blocks.",
                GridDropout: "Structured grid-cell occlusions.",
                Cutout: "Random rectangular masks removed inside image bounds.",
                ImageCompression: "Block artifacts simulating lossy compression.",
                Downscale: "Pixelation from downsample then upsample.",
                ElasticTransform: "Wavy local displacement field.",
                GridDistortion: "Grid-wise piecewise distortion.",
                OpticalDistortion: "Lens-like radial warp and vignetting."
            };
            return descriptions[name] || "Transform preview.";
        }

        function updateMetrics(intensityPercent, transformName) {
            var category = getCategory(transformName);
            var base = 0.66;
            if (category === "blur") base -= 0.03;
            if (category === "noise") base -= 0.02;
            if (category === "weather") base -= 0.025;
            if (category === "dropout") base -= 0.03;

            var uplift = 0.035 + (intensityPercent / 100) * 0.08;
            if (category === "geometry" || category === "crop") uplift += 0.01;
            if (category === "weather" || category === "dropout") uplift += 0.006;

            var boosted = Math.min(0.91, base + uplift);
            miouBase.textContent = base.toFixed(2);
            miouBoost.textContent = boosted.toFixed(2);
            gain.textContent = "+" + (boosted - base).toFixed(2);
        }

        function syncControlState() {
            presetButtons.forEach(function(btn) {
                var preset = btn.getAttribute("data-aug-preset");
                btn.classList.toggle("is-active", preset === getCategory(selectedTransform));
            });

            var liveBtn = transformGallery.querySelector('[data-aug-action="live-toggle"]');
            if (liveBtn) {
                liveBtn.classList.toggle("is-active", liveModeOn);
                liveBtn.textContent = liveModeOn ? "Pause Live" : "Start Live";
            }
        }

        function setTransformNote() {
            if (!transformNote) return;
            var cat = categoryLabel(getCategory(selectedTransform));
            transformNote.textContent = selectedTransform + " | " + cat + " | " + transformDescription(selectedTransform);
        }

        function nextTransform(step) {
            var idx = allAlbumentations.indexOf(selectedTransform);
            if (idx < 0) idx = 0;
            var delta = typeof step === "number" ? step : 1;
            var next = (idx + delta + allAlbumentations.length) % allAlbumentations.length;
            selectedTransform = allAlbumentations[next];
            condition.value = selectedTransform;
        }

        function adjustIntensity(delta) {
            var current = parseInt(intensitySlider.value, 10) || 55;
            var next = clamp(current + delta, 0, 100);
            intensitySlider.value = String(next);
            intensityValue.textContent = String(next) + "%";
        }

        function stopLiveMode() {
            if (liveTimer) {
                window.clearInterval(liveTimer);
                liveTimer = null;
            }
            liveModeOn = false;
        }

        function startLiveMode() {
            if (liveTimer) return;
            liveModeOn = true;
            liveTimer = window.setInterval(function() {
                if (document.hidden) return;
                liveTick += 1;
                if (liveTick % 2 === 0) nextTransform(1);
                variationSeed = Math.floor(Math.random() * 1000000);
                var current = parseInt(intensitySlider.value, 10) || 55;
                if (current >= 92) autoIntensityDirection = -1;
                else if (current <= 18) autoIntensityDirection = 1;
                adjustIntensity(autoIntensityDirection * 3);
                refresh();
            }, 900);
        }

        function buildAugControlBoard() {
            condition.innerHTML = allAlbumentations.map(function(name) {
                var sel = name === selectedTransform ? " selected" : "";
                return '<option value="' + name + '"' + sel + '>' + name + '</option>';
            }).join("");

            transformGallery.innerHTML = [
                '<button type="button" class="aug_transform_chip" data-aug-action="cycle">Next Transform</button>',
                '<button type="button" class="aug_transform_chip" data-aug-action="harder">Intensity +10</button>',
                '<button type="button" class="aug_transform_chip" data-aug-action="easier">Intensity -10</button>',
                '<button type="button" class="aug_transform_chip" data-aug-action="random">New Variation</button>',
                '<button type="button" class="aug_transform_chip" data-aug-action="live-toggle">Start Live</button>'
            ].join("");

            Array.prototype.forEach.call(transformGallery.querySelectorAll(".aug_transform_chip"), function(btn) {
                btn.addEventListener("click", function() {
                    var action = btn.getAttribute("data-aug-action");
                    if (!action) return;

                    if (action === "cycle") {
                        nextTransform(1);
                    } else if (action === "harder") {
                        adjustIntensity(10);
                    } else if (action === "easier") {
                        adjustIntensity(-10);
                    } else if (action === "random") {
                        variationSeed = Math.floor(Math.random() * 1000000);
                    } else if (action === "live-toggle") {
                        if (liveModeOn) stopLiveMode();
                        else startLiveMode();
                    }

                    refresh();
                });
            });
        }

        function renderAugmentedPreview() {
            var rect = sceneRect();
            var source = createSurface(rect.width, rect.height);
            var sctx = source.getContext("2d", { willReadFrequently: true });

            sctx.fillStyle = "#0f172a";
            sctx.fillRect(0, 0, rect.width, rect.height);
            if (sceneImage.complete && sceneImage.naturalWidth) {
                drawImageCover(sctx, sceneImage, rect.width, rect.height);
            } else {
                drawFallbackPatch(sctx, rect.width, rect.height);
            }

            var intensityPercent = parseInt(intensitySlider.value, 10) || 55;
            var intensity = clamp(intensityPercent / 100, 0, 1);
            var seedBase = variationSeed + intensityPercent * 7919 + selectedTransform.length * 104729;
            var rand = makeRng(seedBase);

            var out = transformPatch(source, selectedTransform, intensity, rand);
            ctx.drawImage(out, rect.x, rect.y, rect.width, rect.height);

            ctx.strokeStyle = "rgba(125, 211, 252, 0.72)";
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);

            if (status) {
                status.textContent = selectedTransform + " applied at " + intensityPercent + "% intensity. Live augmentation preview updated.";
            }
            updateMetrics(intensityPercent, selectedTransform);
        }

        function refresh() {
            selectedTransform = condition.value || selectedTransform;
            var intensityPercent = parseInt(intensitySlider.value, 10) || 55;
            intensityValue.textContent = String(intensityPercent) + "%";
            setTransformNote();
            syncControlState();
            drawBackdrop();
            renderAugmentedPreview();
        }

        buildAugControlBoard();

        presetButtons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                var preset = btn.getAttribute("data-aug-preset");
                var list = categoryMap[preset];
                if (!list || !list.length) return;
                var idx = Math.floor(Math.random() * list.length);
                selectedTransform = list[idx];
                condition.value = selectedTransform;
                variationSeed = Math.floor(Math.random() * 1000000);
                refresh();
            });
        });

        randomize.addEventListener("click", function() {
            variationSeed = Math.floor(Math.random() * 1000000);
            refresh();
        });
        condition.addEventListener("change", refresh);
        intensitySlider.addEventListener("input", refresh);
        intensitySlider.addEventListener("change", refresh);
        window.addEventListener("resize", function() {
            sizeCanvas();
            refresh();
        }, { passive: true });
        document.addEventListener("visibilitychange", function() {
            if (document.hidden) {
                stopLiveMode();
                syncControlState();
            } else {
                startLiveMode();
                syncControlState();
            }
        });
        sceneImage.addEventListener("load", refresh);

        sizeCanvas();
        startLiveMode();
        refresh();
        window.__segAugResumeLive = function() {
            startLiveMode();
            syncControlState();
            refresh();
        };
    }

    function setupClassicMlDemo() {
        var canvas = document.getElementById("ml-demo-canvas");
        var algo = document.getElementById("ml-algo");
        var noise = document.getElementById("ml-noise");
        var noiseToggle = document.getElementById("ml-noise-toggle");
        var noiseSpeed = document.getElementById("ml-noise-speed");
        var preset = document.getElementById("ml-preset");
        var imbalance = document.getElementById("ml-imbalance");
        var imbalanceValue = document.getElementById("ml-imbalance-value");
        var outliers = document.getElementById("ml-outliers");
        var scaleFeatures = document.getElementById("ml-scale");
        var split = document.getElementById("ml-split");
        var splitValue = document.getElementById("ml-split-value");
        var depth = document.getElementById("ml-depth");
        var depthValue = document.getElementById("ml-depth-value");
        var forestTrees = document.getElementById("ml-forest-trees");
        var forestValue = document.getElementById("ml-forest-value");
        var depthLabel = document.querySelector('label[for="ml-depth"]');
        var forestLabel = document.querySelector('label[for="ml-forest-trees"]');
        var regenerate = document.getElementById("ml-regenerate");
        var status = document.getElementById("ml-status");
        var algoNote = document.getElementById("ml-algo-note");
        var liveNote = document.getElementById("ml-live-note");
        var metricAcc = document.getElementById("ml-metric-acc");
        var metricF1 = document.getElementById("ml-metric-f1");
        var metricAuc = document.getElementById("ml-metric-auc");
        var confusionEl = document.getElementById("ml-confusion");
        var validationEl = document.getElementById("ml-validation");
        var featureSignalEl = document.getElementById("ml-feature-signal");
        var metricAccLabel = metricAcc ? metricAcc.parentElement.querySelector("span") : null;
        var metricF1Label = metricF1 ? metricF1.parentElement.querySelector("span") : null;
        var metricAucLabel = metricAuc ? metricAuc.parentElement.querySelector("span") : null;
        if (!canvas || !algo || !noise || !noiseToggle || !noiseSpeed || !preset || !imbalance || !imbalanceValue || !outliers || !scaleFeatures || !split || !splitValue || !depth || !depthValue || !forestTrees || !forestValue || !depthLabel || !forestLabel || !regenerate || !status || !algoNote || !liveNote || !metricAcc || !metricF1 || !metricAuc || !confusionEl || !validationEl || !featureSignalEl) return;

        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        var w = 0;
        var h = 0;
        var classData = [];
        var regData = [];
        var trainData = [];
        var testData = [];
        var testLookup = null;
        var noiseAutoTimer = null;
        var noiseDirection = 1;
        var manualNoisePauseUntil = 0;
        var autoNoiseEnabled = true;
        var noiseIntervalMs = 620;

        function uniform(min, max) {
            return min + Math.random() * (max - min);
        }

        function scalePointSet(points) {
            if (!points.length) return points;
            var mx = mean(points.map(function(p) { return p.x; }));
            var my = mean(points.map(function(p) { return p.y; }));
            var sx = Math.sqrt(mean(points.map(function(p) { return Math.pow(p.x - mx, 2); }))) || 1;
            var sy = Math.sqrt(mean(points.map(function(p) { return Math.pow(p.y - my, 2); }))) || 1;
            return points.map(function(p) {
                return { x: (p.x - mx) / sx, y: (p.y - my) / sy, c: p.c };
            });
        }

        function splitData() {
            var ratio = (parseInt(split.value, 10) || 80) / 100;
            var shuffled = classData.slice().sort(function() {
                return Math.random() - 0.5;
            });
            var cut = Math.max(4, Math.min(shuffled.length - 4, Math.floor(shuffled.length * ratio)));
            trainData = shuffled.slice(0, cut);
            testData = shuffled.slice(cut);
            testLookup = new Set(testData);
            splitValue.textContent = String(Math.round(ratio * 100)) + "%";
        }

        function drawCanvasBackdrop() {
            ctx.save();
            var grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, "rgba(5, 12, 28, 0.96)");
            grad.addColorStop(1, "rgba(2, 8, 20, 0.96)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
            ctx.lineWidth = 1;
            for (var gx = 0; gx <= w; gx += 36) {
                ctx.beginPath();
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, h);
                ctx.stroke();
            }
            for (var gy = 0; gy <= h; gy += 30) {
                ctx.beginPath();
                ctx.moveTo(0, gy);
                ctx.lineTo(w, gy);
                ctx.stroke();
            }

            ctx.strokeStyle = "rgba(125, 211, 252, 0.2)";
            ctx.beginPath();
            ctx.moveTo(0, h * 0.5);
            ctx.lineTo(w, h * 0.5);
            ctx.moveTo(w * 0.5, 0);
            ctx.lineTo(w * 0.5, h);
            ctx.stroke();

            ctx.fillStyle = "rgba(216, 236, 255, 0.9)";
            ctx.font = "600 10px Sora, sans-serif";
            ctx.fillText("Train: solid dots", 10, h - 24);
            ctx.fillText("Test: ring markers", 10, h - 10);
            ctx.restore();
        }

        function setScenarioNote(text) {
            algoNote.textContent = text;
        }

        function appendOutliers(points) {
            if (!outliers.checked) return points;
            var outCount = 10;
            for (var i = 0; i < outCount; i += 1) {
                points.push({ x: uniform(-1.15, 1.15), y: uniform(-1.15, 1.15), c: Math.random() > 0.5 ? 1 : 0 });
            }
            return points;
        }

        function makePresetData() {
            var total = 180;
            var c1Ratio = (parseInt(imbalance.value, 10) || 50) / 100;
            var c1Count = Math.max(20, Math.min(total - 20, Math.round(total * c1Ratio)));
            var c0Count = total - c1Count;
            var points = [];
            var mode = preset.value;

            if (mode === "moons") {
                for (var m0 = 0; m0 < c0Count; m0 += 1) {
                    var t0 = Math.PI * (m0 / Math.max(1, c0Count - 1));
                    points.push({ x: Math.cos(t0) * 0.48 + randn() * 0.05, y: Math.sin(t0) * 0.34 + randn() * 0.05, c: 0 });
                }
                for (var m1 = 0; m1 < c1Count; m1 += 1) {
                    var t1 = Math.PI * (m1 / Math.max(1, c1Count - 1));
                    points.push({ x: 0.28 - Math.cos(t1) * 0.48 + randn() * 0.05, y: -0.08 - Math.sin(t1) * 0.34 + randn() * 0.05, c: 1 });
                }
                return appendOutliers(points);
            }

            if (mode === "xor") {
                var centers = [
                    { x: -0.55, y: -0.55, c: 0 },
                    { x: 0.55, y: 0.55, c: 0 },
                    { x: -0.55, y: 0.55, c: 1 },
                    { x: 0.55, y: -0.55, c: 1 }
                ];
                var per = Math.floor(total / centers.length);
                centers.forEach(function(center) {
                    for (var i = 0; i < per; i += 1) {
                        points.push({ x: center.x + randn() * 0.16, y: center.y + randn() * 0.16, c: center.c });
                    }
                });
                return appendOutliers(points);
            }

            if (mode === "concentric") {
                for (var r0 = 0; r0 < c0Count; r0 += 1) {
                    var a0 = 2 * Math.PI * (r0 / Math.max(1, c0Count));
                    points.push({ x: Math.cos(a0) * 0.28 + randn() * 0.05, y: Math.sin(a0) * 0.28 + randn() * 0.05, c: 0 });
                }
                for (var r1 = 0; r1 < c1Count; r1 += 1) {
                    var a1 = 2 * Math.PI * (r1 / Math.max(1, c1Count));
                    points.push({ x: Math.cos(a1) * 0.65 + randn() * 0.06, y: Math.sin(a1) * 0.65 + randn() * 0.06, c: 1 });
                }
                return appendOutliers(points);
            }

            // default: linear-separable gaussian blobs
            var sigma = (parseInt(noise.value, 10) || 12) / 120;
            for (var i0 = 0; i0 < c0Count; i0 += 1) {
                points.push({ x: -0.45 + randn() * sigma, y: 0.1 + randn() * sigma, c: 0 });
            }
            for (var i1 = 0; i1 < c1Count; i1 += 1) {
                points.push({ x: 0.45 + randn() * sigma, y: -0.1 + randn() * sigma, c: 1 });
            }
            return appendOutliers(points);
        }

        function sizeCanvas() {
            var wrap = canvas.parentElement;
            var width = Math.max(360, Math.min(760, (wrap && wrap.clientWidth ? wrap.clientWidth : 640) - 4));
            w = Math.round(width);
            h = Math.round(width * 0.58);
            canvas.width = w;
            canvas.height = h;
        }

        function randn() {
            var u = 1 - Math.random();
            var v = 1 - Math.random();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        }

        function genData() {
            var sigma = (parseInt(noise.value, 10) || 12) / 120;
            classData = makePresetData();
            if (scaleFeatures.checked) classData = scalePointSet(classData);
            splitData();
            regData = [];
            for (var j = 0; j < 110; j += 1) {
                var x = -1 + (j / 109) * 2;
                regData.push({ x: x, y: 0.65 * x + 0.15 + randn() * sigma * 0.9 });
            }
        }

        function ptx(x) { return (x + 1.2) / 2.4 * w; }
        function pty(y) { return h - ((y + 1.2) / 2.4 * h); }

        function setShowcase(useWhen, bestFit, deliveryImpact) {
            if (metricAccLabel) metricAccLabel.textContent = "Use When";
            if (metricF1Label) metricF1Label.textContent = "Best Fit";
            if (metricAucLabel) metricAucLabel.textContent = "Delivery Impact";
            metricAcc.textContent = useWhen;
            metricF1.textContent = bestFit;
            metricAuc.textContent = deliveryImpact;
        }

        function setDiagnostics(confText, valText, featText) {
            confusionEl.textContent = confText;
            validationEl.textContent = valText;
            featureSignalEl.textContent = featText;
        }

        function pauseAutoNoise(ms) {
            manualNoisePauseUntil = Date.now() + ms;
        }

        function startNoiseAutoFlow() {
            if (noiseAutoTimer) window.clearInterval(noiseAutoTimer);
            noiseAutoTimer = window.setInterval(function() {
                if (Date.now() < manualNoisePauseUntil || document.hidden) return;
                if (!autoNoiseEnabled) return;

                var mlPanel = document.getElementById("ai-view-ml");
                if (mlPanel && mlPanel.hidden) return;

                var min = parseInt(noise.min, 10) || 0;
                var max = parseInt(noise.max, 10) || 40;
                var current = parseInt(noise.value, 10);
                if (isNaN(current)) current = 12;

                var next = current + noiseDirection * 2;
                if (next >= max) {
                    next = max;
                    noiseDirection = -1;
                } else if (next <= min) {
                    next = min;
                    noiseDirection = 1;
                }

                if (next !== current) {
                    noise.value = String(next);
                    rerun();
                }
            }, noiseIntervalMs);
        }

        function mean(values) {
            if (!values.length) return 0;
            var sum = 0;
            for (var i = 0; i < values.length; i += 1) sum += values[i];
            return sum / values.length;
        }

        function aucFromScores(labels, scores) {
            var pairs = scores.map(function(s, idx) {
                return { score: s, label: labels[idx] };
            }).sort(function(a, b) {
                return a.score - b.score;
            });

            var pos = 0;
            var neg = 0;
            var rankSumPos = 0;
            for (var i = 0; i < pairs.length; i += 1) {
                if (pairs[i].label === 1) {
                    pos += 1;
                    rankSumPos += (i + 1);
                } else {
                    neg += 1;
                }
            }
            if (pos === 0 || neg === 0) return 0.5;
            return (rankSumPos - (pos * (pos + 1)) / 2) / (pos * neg);
        }

        function classificationMetrics(predictions, labels, scores) {
            var tp = 0, fp = 0, fn = 0, tn = 0;
            for (var i = 0; i < predictions.length; i += 1) {
                var pred = predictions[i];
                var truth = labels[i];
                if (pred === 1 && truth === 1) tp += 1;
                else if (pred === 1 && truth === 0) fp += 1;
                else if (pred === 0 && truth === 1) fn += 1;
                else tn += 1;
            }

            var total = Math.max(1, predictions.length);
            var acc = (tp + tn) / total;
            var precision = tp / Math.max(1, tp + fp);
            var recall = tp / Math.max(1, tp + fn);
            var f1 = (2 * precision * recall) / Math.max(1e-6, precision + recall);
            var auc = aucFromScores(labels, scores);
            return { acc: acc, f1: f1, auc: auc, tp: tp, fp: fp, tn: tn, fn: fn };
        }

        function evaluateClassifier(scoreFn) {
            var labels = [];
            var scores = [];
            var preds = [];

            var evalSet = testData.length ? testData : classData;
            evalSet.forEach(function(p) {
                var score = scoreFn(p);
                scores.push(score);
                labels.push(p.c);
                preds.push(score >= 0 ? 1 : 0);
            });

            return classificationMetrics(preds, labels, scores);
        }

        function collectTreeImportance(tree, score) {
            if (!tree || tree.leaf) return;
            if (tree.axis === "x") score.x += 1;
            else score.y += 1;
            collectTreeImportance(tree.left, score);
            collectTreeImportance(tree.right, score);
        }

        function drawTreeInset(trees, label, depthVal, forestVal) {
            if (!trees || !trees.length) return;

            var boxW = Math.min(230, Math.round(w * 0.36));
            var boxH = Math.min(150, Math.round(h * 0.38));
            var boxX = w - boxW - 12;
            var boxY = 12;

            ctx.save();
            ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
            ctx.strokeStyle = "rgba(125, 211, 252, 0.42)";
            ctx.lineWidth = 1;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = "#d8ecff";
            ctx.font = "600 10px Sora, sans-serif";
            ctx.fillText(label + " | depth " + depthVal + (label === "Random Forest" ? " | trees " + forestVal : ""), boxX + 8, boxY + 14);

            function drawOne(tree, originX, originY, width, levels) {
                var current = [{ node: tree, x: originX + width / 2, y: originY + 16 }];
                for (var level = 0; level < levels; level += 1) {
                    var next = [];
                    current.forEach(function(entry, idx) {
                        var node = entry.node;
                        var spread = (width * 0.22) / (level + 1);
                        if (!node || node.leaf) return;

                        var ly = entry.y + ((boxH - 26) / Math.max(2, levels + 1));
                        var lx = entry.x - spread - (idx % 2) * 2;
                        var rx = entry.x + spread + (idx % 2) * 2;

                        ctx.strokeStyle = "rgba(103, 232, 249, 0.44)";
                        ctx.beginPath();
                        ctx.moveTo(entry.x, entry.y);
                        ctx.lineTo(lx, ly);
                        ctx.moveTo(entry.x, entry.y);
                        ctx.lineTo(rx, ly);
                        ctx.stroke();

                        next.push({ node: node.left, x: lx, y: ly });
                        next.push({ node: node.right, x: rx, y: ly });
                    });

                    current.forEach(function(entry) {
                        ctx.fillStyle = "#38bdf8";
                        ctx.beginPath();
                        ctx.arc(entry.x, entry.y, 2.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    current = next;
                }
            }

            if (trees.length === 1) {
                drawOne(trees[0], boxX + 6, boxY + 4, boxW - 12, Math.min(4, depthVal));
            } else {
                var shown = Math.min(3, trees.length);
                var lane = (boxW - 16) / shown;
                for (var i = 0; i < shown; i += 1) {
                    drawOne(trees[i], boxX + 8 + i * lane, boxY + 8, lane - 6, Math.min(3, depthVal));
                }
            }
            ctx.restore();
        }

        function drawClassifierBoundary(scoreFn, alpha, tintA, tintB) {
            var step = 11;
            ctx.globalAlpha = alpha;
            for (var px = 0; px < w; px += step) {
                for (var py = 0; py < h; py += step) {
                    var wx = (px / w) * 2.4 - 1.2;
                    var wy = ((h - py) / h) * 2.4 - 1.2;
                    var score = scoreFn({ x: wx, y: wy });
                    ctx.fillStyle = score >= 0 ? tintB : tintA;
                    ctx.fillRect(px, py, step, step);
                }
            }
            ctx.globalAlpha = 1;
        }

        function fitNaiveBayesStats() {
            var cls0 = classData.filter(function(p) { return p.c === 0; });
            var cls1 = classData.filter(function(p) { return p.c === 1; });
            var m0x = mean(cls0.map(function(p) { return p.x; }));
            var m0y = mean(cls0.map(function(p) { return p.y; }));
            var m1x = mean(cls1.map(function(p) { return p.x; }));
            var m1y = mean(cls1.map(function(p) { return p.y; }));

            function variance(points, field, m) {
                var sum = 0;
                for (var i = 0; i < points.length; i += 1) {
                    var d = points[i][field] - m;
                    sum += d * d;
                }
                return Math.max(1e-3, sum / Math.max(1, points.length));
            }

            return {
                c0: { mx: m0x, my: m0y, vx: variance(cls0, "x", m0x), vy: variance(cls0, "y", m0y), prior: cls0.length / Math.max(1, classData.length) },
                c1: { mx: m1x, my: m1y, vx: variance(cls1, "x", m1x), vy: variance(cls1, "y", m1y), prior: cls1.length / Math.max(1, classData.length) }
            };
        }

        function naiveBayesScore(stats, point) {
            function logGauss(x, m, v) {
                return -0.5 * (Math.log(2 * Math.PI * v) + ((x - m) * (x - m)) / v);
            }
            var l0 = Math.log(Math.max(1e-8, stats.c0.prior)) + logGauss(point.x, stats.c0.mx, stats.c0.vx) + logGauss(point.y, stats.c0.my, stats.c0.vy);
            var l1 = Math.log(Math.max(1e-8, stats.c1.prior)) + logGauss(point.x, stats.c1.mx, stats.c1.vx) + logGauss(point.y, stats.c1.my, stats.c1.vy);
            return l1 - l0;
        }

        function gini(points) {
            if (!points.length) return 0;
            var p1 = points.filter(function(p) { return p.c === 1; }).length / points.length;
            var p0 = 1 - p1;
            return 1 - (p0 * p0 + p1 * p1);
        }

        function candidateThresholds(points, axis) {
            var values = points.map(function(p) {
                return axis === "x" ? p.x : p.y;
            }).sort(function(a, b) { return a - b; });

            if (values.length < 3) return [];
            var cuts = [];
            var steps = Math.min(12, values.length - 1);
            for (var i = 1; i <= steps; i += 1) {
                var idx = Math.floor((i / (steps + 1)) * (values.length - 1));
                var a = values[idx];
                var b = values[Math.min(values.length - 1, idx + 1)];
                cuts.push((a + b) * 0.5);
            }
            return cuts;
        }

        function bestSplit(points) {
            var base = gini(points);
            var bestGain = 0;
            var best = null;

            ["x", "y"].forEach(function(axis) {
                candidateThresholds(points, axis).forEach(function(thresh) {
                    var left = [];
                    var right = [];
                    for (var i = 0; i < points.length; i += 1) {
                        var v = axis === "x" ? points[i].x : points[i].y;
                        if (v <= thresh) left.push(points[i]);
                        else right.push(points[i]);
                    }
                    if (left.length < 5 || right.length < 5) return;
                    var weighted = (left.length / points.length) * gini(left) + (right.length / points.length) * gini(right);
                    var gain = base - weighted;
                    if (gain > bestGain) {
                        bestGain = gain;
                        best = { axis: axis, thresh: thresh, left: left, right: right };
                    }
                });
            });

            return best;
        }

        function fitDecisionTree(points, maxDepth) {
            function build(nodePoints, depthLeft) {
                var pos = nodePoints.filter(function(p) { return p.c === 1; }).length;
                var prob = pos / Math.max(1, nodePoints.length);
                var allSame = (prob === 0 || prob === 1);
                if (depthLeft <= 0 || allSame || nodePoints.length < 12) {
                    return { leaf: true, prob: prob };
                }

                var split = bestSplit(nodePoints);
                if (!split) {
                    return { leaf: true, prob: prob };
                }

                return {
                    leaf: false,
                    axis: split.axis,
                    thresh: split.thresh,
                    left: build(split.left, depthLeft - 1),
                    right: build(split.right, depthLeft - 1)
                };
            }

            return build(points, maxDepth);
        }

        function treeScore(tree, point) {
            var node = tree;
            while (node && !node.leaf) {
                var v = node.axis === "x" ? point.x : point.y;
                node = v <= node.thresh ? node.left : node.right;
            }
            var p = node ? node.prob : 0.5;
            return p - 0.5;
        }

        function fitRandomForest(points, treeCount, maxDepth) {
            var trees = [];
            for (var t = 0; t < treeCount; t += 1) {
                var sample = [];
                for (var i = 0; i < points.length; i += 1) {
                    sample.push(points[Math.floor(Math.random() * points.length)]);
                }
                trees.push(fitDecisionTree(sample, maxDepth));
            }
            return trees;
        }

        function forestScore(trees, point) {
            if (!trees.length) return 0;
            var sum = 0;
            for (var i = 0; i < trees.length; i += 1) {
                sum += treeScore(trees[i], point);
            }
            return sum / trees.length;
        }

        function fitExtraTree(points, maxDepth) {
            function build(nodePoints, depthLeft) {
                var pos = nodePoints.filter(function(p) { return p.c === 1; }).length;
                var prob = pos / Math.max(1, nodePoints.length);
                var allSame = (prob === 0 || prob === 1);
                if (depthLeft <= 0 || allSame || nodePoints.length < 10) {
                    return { leaf: true, prob: prob };
                }

                var axis = Math.random() > 0.5 ? "x" : "y";
                var vals = nodePoints.map(function(p) { return axis === "x" ? p.x : p.y; });
                var minV = Math.min.apply(Math, vals);
                var maxV = Math.max.apply(Math, vals);
                if (!isFinite(minV) || !isFinite(maxV) || minV === maxV) {
                    return { leaf: true, prob: prob };
                }

                var thresh = minV + Math.random() * (maxV - minV);
                var left = [];
                var right = [];
                nodePoints.forEach(function(p) {
                    var v = axis === "x" ? p.x : p.y;
                    if (v <= thresh) left.push(p);
                    else right.push(p);
                });

                if (left.length < 4 || right.length < 4) {
                    return { leaf: true, prob: prob };
                }

                return {
                    leaf: false,
                    axis: axis,
                    thresh: thresh,
                    left: build(left, depthLeft - 1),
                    right: build(right, depthLeft - 1)
                };
            }

            return build(points, maxDepth);
        }

        function fitExtraTrees(points, treeCount, maxDepth) {
            var trees = [];
            for (var t = 0; t < treeCount; t += 1) {
                var sample = [];
                for (var i = 0; i < points.length; i += 1) {
                    sample.push(points[Math.floor(Math.random() * points.length)]);
                }
                trees.push(fitExtraTree(sample, maxDepth));
            }
            return trees;
        }

        function fitAdaBoostStumps(points, rounds) {
            if (!points.length) return { stumps: [], importance: { x: 0, y: 0 }, rounds: rounds };
            var labels = points.map(function(p) { return p.c === 1 ? 1 : -1; });
            var weights = points.map(function() { return 1 / points.length; });
            var stumps = [];
            var importance = { x: 0, y: 0 };

            for (var r = 0; r < rounds; r += 1) {
                var best = null;
                ["x", "y"].forEach(function(axis) {
                    candidateThresholds(points, axis).forEach(function(thresh) {
                        [-1, 1].forEach(function(polarity) {
                            var err = 0;
                            for (var i = 0; i < points.length; i += 1) {
                                var v = axis === "x" ? points[i].x : points[i].y;
                                var pred = (v <= thresh ? -1 : 1) * polarity;
                                if (pred !== labels[i]) err += weights[i];
                            }
                            if (!best || err < best.err) {
                                best = { axis: axis, thresh: thresh, polarity: polarity, err: err };
                            }
                        });
                    });
                });

                if (!best) break;
                var safeErr = Math.max(1e-6, Math.min(0.499, best.err));
                var alpha = 0.5 * Math.log((1 - safeErr) / safeErr);
                stumps.push({ axis: best.axis, thresh: best.thresh, polarity: best.polarity, alpha: alpha });
                importance[best.axis] += Math.abs(alpha);

                var z = 0;
                for (var j = 0; j < points.length; j += 1) {
                    var vv = best.axis === "x" ? points[j].x : points[j].y;
                    var predj = (vv <= best.thresh ? -1 : 1) * best.polarity;
                    weights[j] = weights[j] * Math.exp(-alpha * labels[j] * predj);
                    z += weights[j];
                }
                for (var k = 0; k < weights.length; k += 1) {
                    weights[k] = weights[k] / Math.max(1e-8, z);
                }
            }

            return { stumps: stumps, importance: importance, rounds: rounds };
        }

        function scoreAdaBoost(model, point) {
            if (!model || !model.stumps || !model.stumps.length) return 0;
            var sum = 0;
            model.stumps.forEach(function(stump) {
                var v = stump.axis === "x" ? point.x : point.y;
                var pred = (v <= stump.thresh ? -1 : 1) * stump.polarity;
                sum += stump.alpha * pred;
            });
            return sum;
        }

        function fitGradientBoostedStumps(points, rounds, variant) {
            if (!points.length) return { stumps: [], importance: { x: 0, y: 0 }, rounds: rounds, variant: variant };

            var labels = points.map(function(p) { return p.c === 1 ? 1 : -1; });
            var scores = points.map(function() { return 0; });
            var stumps = [];
            var importance = { x: 0, y: 0 };
            var lr = variant === "lightgbm" ? 0.28 : (variant === "catboost" ? 0.2 : 0.22);
            var lambda = variant === "xgboost" ? 1.2 : (variant === "lightgbm" ? 0.6 : 0.9);

            for (var r = 0; r < rounds; r += 1) {
                var residuals = scores.map(function(s, i) {
                    return labels[i] - Math.tanh(s);
                });

                var best = null;
                ["x", "y"].forEach(function(axis) {
                    var thresholds = candidateThresholds(points, axis);
                    if (variant === "lightgbm" && thresholds.length > 6) {
                        // histogram-style approximation using fewer bins
                        thresholds = thresholds.filter(function(_, idx) { return idx % 2 === 0; });
                    }
                    thresholds.forEach(function(thresh) {
                        var leftIdx = [];
                        var rightIdx = [];
                        for (var i = 0; i < points.length; i += 1) {
                            var v = axis === "x" ? points[i].x : points[i].y;
                            if (v <= thresh) leftIdx.push(i);
                            else rightIdx.push(i);
                        }
                        if (leftIdx.length < 4 || rightIdx.length < 4) return;

                        var sumL = 0;
                        var sumR = 0;
                        leftIdx.forEach(function(i) { sumL += residuals[i]; });
                        rightIdx.forEach(function(i) { sumR += residuals[i]; });
                        var leftVal = sumL / (leftIdx.length + lambda);
                        var rightVal = sumR / (rightIdx.length + lambda);

                        var sse = 0;
                        leftIdx.forEach(function(i) {
                            var d = residuals[i] - leftVal;
                            sse += d * d;
                        });
                        rightIdx.forEach(function(i) {
                            var d = residuals[i] - rightVal;
                            sse += d * d;
                        });

                        if (variant === "catboost") {
                            // slight regularization to mimic ordered/stable updates
                            sse *= 1.02;
                        }

                        if (!best || sse < best.sse) {
                            best = {
                                axis: axis,
                                thresh: thresh,
                                leftVal: leftVal,
                                rightVal: rightVal,
                                leftIdx: leftIdx,
                                rightIdx: rightIdx,
                                sse: sse
                            };
                        }
                    });
                });

                if (!best) break;
                var gain = 1 / Math.max(1e-6, best.sse);
                stumps.push({ axis: best.axis, thresh: best.thresh, leftVal: best.leftVal, rightVal: best.rightVal, gain: gain });
                importance[best.axis] += gain;

                best.leftIdx.forEach(function(i) { scores[i] += lr * best.leftVal; });
                best.rightIdx.forEach(function(i) { scores[i] += lr * best.rightVal; });
            }

            return { stumps: stumps, importance: importance, rounds: rounds, variant: variant, lr: lr };
        }

        function scoreGradientBoosting(model, point) {
            if (!model || !model.stumps || !model.stumps.length) return 0;
            var sum = 0;
            var lr = model.lr || 0.2;
            model.stumps.forEach(function(stump) {
                var v = stump.axis === "x" ? point.x : point.y;
                sum += lr * (v <= stump.thresh ? stump.leftVal : stump.rightVal);
            });
            return sum;
        }

        function drawBoostingInset(model, label, accent) {
            if (!model || !model.stumps || !model.stumps.length) return;

            var boxW = Math.min(230, Math.round(w * 0.36));
            var boxH = Math.min(150, Math.round(h * 0.38));
            var boxX = w - boxW - 12;
            var boxY = 12;
            var top = model.stumps.slice(-8);
            var maxGain = Math.max(1e-6, Math.max.apply(Math, top.map(function(s) { return Math.abs(s.gain || s.alpha || 0); })));

            ctx.save();
            ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = "#d8ecff";
            ctx.font = "600 10px Sora, sans-serif";
            ctx.fillText(label + " | rounds " + model.stumps.length, boxX + 8, boxY + 14);

            var barW = Math.max(8, Math.floor((boxW - 20) / Math.max(1, top.length)) - 2);
            for (var i = 0; i < top.length; i += 1) {
                var g = Math.abs(top[i].gain || top[i].alpha || 0);
                var bh = Math.max(4, Math.round((g / maxGain) * (boxH - 36)));
                var bx = boxX + 10 + i * (barW + 2);
                var by = boxY + boxH - 10 - bh;
                ctx.fillStyle = top[i].axis === "x" ? "rgba(56, 189, 248, 0.9)" : "rgba(244, 114, 182, 0.9)";
                ctx.fillRect(bx, by, barW, bh);
            }
            ctx.restore();
        }

        function fitLDA(points) {
            var c0 = points.filter(function(p) { return p.c === 0; });
            var c1 = points.filter(function(p) { return p.c === 1; });
            var m0 = { x: mean(c0.map(function(p) { return p.x; })), y: mean(c0.map(function(p) { return p.y; })) };
            var m1 = { x: mean(c1.map(function(p) { return p.x; })), y: mean(c1.map(function(p) { return p.y; })) };

            function cov(pts, m) {
                var sxx = 0, syy = 0, sxy = 0;
                pts.forEach(function(p) {
                    var dx = p.x - m.x;
                    var dy = p.y - m.y;
                    sxx += dx * dx;
                    syy += dy * dy;
                    sxy += dx * dy;
                });
                var d = Math.max(1, pts.length - 1);
                return { xx: sxx / d, yy: syy / d, xy: sxy / d };
            }

            var s0 = cov(c0, m0);
            var s1 = cov(c1, m1);
            var sw = {
                xx: (s0.xx + s1.xx) * 0.5 + 1e-3,
                yy: (s0.yy + s1.yy) * 0.5 + 1e-3,
                xy: (s0.xy + s1.xy) * 0.5
            };

            var det = sw.xx * sw.yy - sw.xy * sw.xy;
            if (Math.abs(det) < 1e-8) det = 1e-8;
            var inv = { xx: sw.yy / det, yy: sw.xx / det, xy: -sw.xy / det };
            var dx = m1.x - m0.x;
            var dy = m1.y - m0.y;
            var wx = inv.xx * dx + inv.xy * dy;
            var wy = inv.xy * dx + inv.yy * dy;
            var b = -0.5 * (wx * (m1.x + m0.x) + wy * (m1.y + m0.y));
            return { wx: wx, wy: wy, b: b };
        }

        function scoreLDA(model, point) {
            return model.wx * point.x + model.wy * point.y + model.b;
        }

        function fitQDA(points) {
            var c0 = points.filter(function(p) { return p.c === 0; });
            var c1 = points.filter(function(p) { return p.c === 1; });
            function stats(pts) {
                var mx = mean(pts.map(function(p) { return p.x; }));
                var my = mean(pts.map(function(p) { return p.y; }));
                var sxx = 0, syy = 0, sxy = 0;
                pts.forEach(function(p) {
                    var dx = p.x - mx;
                    var dy = p.y - my;
                    sxx += dx * dx;
                    syy += dy * dy;
                    sxy += dx * dy;
                });
                var d = Math.max(1, pts.length - 1);
                var cov = { xx: sxx / d + 1e-3, yy: syy / d + 1e-3, xy: sxy / d };
                var det = cov.xx * cov.yy - cov.xy * cov.xy;
                if (Math.abs(det) < 1e-8) det = 1e-8;
                var inv = { xx: cov.yy / det, yy: cov.xx / det, xy: -cov.xy / det };
                return { mx: mx, my: my, cov: cov, inv: inv, det: det, prior: pts.length / Math.max(1, points.length) };
            }
            return { c0: stats(c0), c1: stats(c1) };
        }

        function scoreQDA(model, point) {
            function logLike(cls) {
                var dx = point.x - cls.mx;
                var dy = point.y - cls.my;
                var q = cls.inv.xx * dx * dx + 2 * cls.inv.xy * dx * dy + cls.inv.yy * dy * dy;
                return -0.5 * Math.log(Math.abs(cls.det)) - 0.5 * q + Math.log(Math.max(1e-8, cls.prior));
            }
            return logLike(model.c1) - logLike(model.c0);
        }

        function scoreGaussianProcessClassifier(points, point, lengthScale) {
            var ls2 = lengthScale * lengthScale;
            var sum = 0;
            var norm = 0;
            points.forEach(function(p) {
                var dx = point.x - p.x;
                var dy = point.y - p.y;
                var k = Math.exp(-(dx * dx + dy * dy) / Math.max(1e-6, 2 * ls2));
                var y = p.c === 1 ? 1 : -1;
                sum += k * y;
                norm += k;
            });
            return norm > 0 ? sum / norm : 0;
        }

        function scoreGaussianProcessRegressor(points, x, lengthScale) {
            var ls2 = lengthScale * lengthScale;
            var sum = 0;
            var norm = 0;
            points.forEach(function(p) {
                var dx = x - p.x;
                var k = Math.exp(-(dx * dx) / Math.max(1e-6, 2 * ls2));
                sum += k * p.y;
                norm += k;
            });
            return norm > 0 ? sum / norm : 0;
        }

        function fitRidge(regPoints, lambda) {
            var sx = 0, sy = 0, sxx = 0, sxy = 0;
            regPoints.forEach(function(p) {
                sx += p.x;
                sy += p.y;
                sxx += p.x * p.x;
                sxy += p.x * p.y;
            });
            var n = Math.max(1, regPoints.length);
            var mx = sx / n;
            var my = sy / n;
            var m = (sxy - n * mx * my) / Math.max(1e-6, (sxx - n * mx * mx + lambda));
            var b = my - m * mx;
            return { m: m, b: b };
        }

        function fitLasso(regPoints, lambda) {
            var b = mean(regPoints.map(function(p) { return p.y; }));
            var m = 0;
            for (var it = 0; it < 40; it += 1) {
                var numer = 0;
                var denom = 0;
                regPoints.forEach(function(p) {
                    numer += p.x * (p.y - b);
                    denom += p.x * p.x;
                });
                var th = lambda * regPoints.length;
                if (numer > th) m = (numer - th) / Math.max(1e-6, denom);
                else if (numer < -th) m = (numer + th) / Math.max(1e-6, denom);
                else m = 0;
                b = mean(regPoints.map(function(p) { return p.y - m * p.x; }));
            }
            return { m: m, b: b };
        }

        function fitElasticNet(regPoints, l1, l2) {
            var ridge = fitRidge(regPoints, l2);
            var lasso = fitLasso(regPoints, l1);
            return { m: (ridge.m + lasso.m) * 0.5, b: (ridge.b + lasso.b) * 0.5 };
        }

        function runDbscan(points, eps, minPts) {
            var labels = new Array(points.length).fill(undefined);
            var clusterId = 0;

            function regionQuery(idx) {
                var n = [];
                var p = points[idx];
                for (var i = 0; i < points.length; i += 1) {
                    var dx = points[i].x - p.x;
                    var dy = points[i].y - p.y;
                    if (dx * dx + dy * dy <= eps * eps) n.push(i);
                }
                return n;
            }

            function expandCluster(idx, neighbors, cid) {
                labels[idx] = cid;
                var queue = neighbors.slice();
                while (queue.length) {
                    var q = queue.shift();
                    if (labels[q] === -1) labels[q] = cid;
                    if (labels[q] !== undefined) continue;
                    labels[q] = cid;
                    var qn = regionQuery(q);
                    if (qn.length >= minPts) {
                        qn.forEach(function(v) {
                            if (queue.indexOf(v) === -1) queue.push(v);
                        });
                    }
                }
            }

            for (var i = 0; i < points.length; i += 1) {
                if (labels[i] !== undefined) continue;
                var neighbors = regionQuery(i);
                if (neighbors.length < minPts) {
                    labels[i] = -1;
                } else {
                    clusterId += 1;
                    expandCluster(i, neighbors, clusterId);
                }
            }

            return { labels: labels, clusters: clusterId };
        }

        function runAgglomerative(points, targetK) {
            var clusters = points.map(function(_, idx) { return [idx]; });

            function centroid(cluster) {
                var sx = 0, sy = 0;
                cluster.forEach(function(i) {
                    sx += points[i].x;
                    sy += points[i].y;
                });
                return { x: sx / cluster.length, y: sy / cluster.length };
            }

            while (clusters.length > targetK) {
                var bestI = 0, bestJ = 1;
                var bestD = Infinity;
                for (var i = 0; i < clusters.length; i += 1) {
                    var ci = centroid(clusters[i]);
                    for (var j = i + 1; j < clusters.length; j += 1) {
                        var cj = centroid(clusters[j]);
                        var dx = ci.x - cj.x;
                        var dy = ci.y - cj.y;
                        var d = dx * dx + dy * dy;
                        if (d < bestD) {
                            bestD = d;
                            bestI = i;
                            bestJ = j;
                        }
                    }
                }
                var merged = clusters[bestI].concat(clusters[bestJ]);
                clusters.splice(bestJ, 1);
                clusters.splice(bestI, 1, merged);
            }

            var labels = new Array(points.length).fill(-1);
            clusters.forEach(function(cluster, idx) {
                cluster.forEach(function(i) {
                    labels[i] = idx;
                });
            });
            return { labels: labels, clusters: clusters.length };
        }

        function fitOneClassBoundary(points, nu) {
            var mx = mean(points.map(function(p) { return p.x; }));
            var my = mean(points.map(function(p) { return p.y; }));
            var dists = points.map(function(p) {
                var dx = p.x - mx;
                var dy = p.y - my;
                return Math.sqrt(dx * dx + dy * dy);
            }).sort(function(a, b) { return a - b; });
            var q = Math.max(0, Math.min(dists.length - 1, Math.floor((1 - nu) * dists.length)));
            return { mx: mx, my: my, radius: dists[q] || 0.8 };
        }

        function scoreOneClassBoundary(model, point) {
            var dx = point.x - model.mx;
            var dy = point.y - model.my;
            return model.radius - Math.sqrt(dx * dx + dy * dy);
        }

        function fitIsolationForest(points, treeCount, maxDepth) {
            function build(sample, depth) {
                if (depth >= maxDepth || sample.length <= 2) {
                    return { leaf: true, size: sample.length };
                }
                var axis = Math.random() > 0.5 ? "x" : "y";
                var vals = sample.map(function(p) { return axis === "x" ? p.x : p.y; });
                var minV = Math.min.apply(Math, vals);
                var maxV = Math.max.apply(Math, vals);
                if (minV === maxV) return { leaf: true, size: sample.length };
                var thresh = minV + Math.random() * (maxV - minV);
                var left = [];
                var right = [];
                sample.forEach(function(p) {
                    var v = axis === "x" ? p.x : p.y;
                    if (v <= thresh) left.push(p);
                    else right.push(p);
                });
                if (!left.length || !right.length) return { leaf: true, size: sample.length };
                return { leaf: false, axis: axis, thresh: thresh, left: build(left, depth + 1), right: build(right, depth + 1) };
            }

            var trees = [];
            for (var t = 0; t < treeCount; t += 1) {
                var sample = [];
                for (var i = 0; i < points.length; i += 1) {
                    sample.push(points[Math.floor(Math.random() * points.length)]);
                }
                trees.push(build(sample, 0));
            }
            return { trees: trees, maxDepth: maxDepth };
        }

        function isolationPathLength(tree, point, depth) {
            if (!tree || tree.leaf) return depth;
            var v = tree.axis === "x" ? point.x : point.y;
            if (v <= tree.thresh) return isolationPathLength(tree.left, point, depth + 1);
            return isolationPathLength(tree.right, point, depth + 1);
        }

        function scoreIsolationForest(model, point) {
            if (!model || !model.trees || !model.trees.length) return 0;
            var sum = 0;
            model.trees.forEach(function(tree) {
                sum += isolationPathLength(tree, point, 0);
            });
            var avg = sum / model.trees.length;
            return model.maxDepth - avg;
        }

        function drawPoints(data, colorA, colorB) {
            data.forEach(function(p) {
                ctx.fillStyle = p.c === 0 ? colorA : colorB;
                ctx.beginPath();
                ctx.arc(ptx(p.x), pty(p.y), 3.2, 0, Math.PI * 2);
                ctx.fill();

                if (testLookup && testLookup.has(p)) {
                    ctx.strokeStyle = "rgba(236, 254, 255, 0.85)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(ptx(p.x), pty(p.y), 5.2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        function drawDecisionBoundaryMap(k, alpha, tintA, tintB) {
            var step = 11;
            for (var px = 0; px < w; px += step) {
                for (var py = 0; py < h; py += step) {
                    var wx = (px / w) * 2.4 - 1.2;
                    var wy = ((h - py) / h) * 2.4 - 1.2;
                    var dists = classData.map(function(p) {
                        var dx = p.x - wx;
                        var dy = p.y - wy;
                        return { c: p.c, d: Math.sqrt(dx * dx + dy * dy) };
                    }).sort(function(a, b) { return a.d - b.d; });
                    var votes = { z0: 0, z1: 0 };
                    for (var i = 0; i < Math.min(k, dists.length); i += 1) {
                        if (dists[i].c === 0) votes.z0 += 1;
                        else votes.z1 += 1;
                    }
                    ctx.fillStyle = votes.z0 >= votes.z1 ? tintA : tintB;
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(px, py, step, step);
                }
            }
            ctx.globalAlpha = 1;
        }

        function drawGaussianEllipses() {
            var means = fitMeans();
            var sigma = (parseInt(noise.value, 10) || 12) / 120;
            var rx = 0.24 + sigma * 0.9;
            var ry = 0.18 + sigma * 0.7;
            [
                { m: means.a, color: "rgba(56,189,248,0.2)" },
                { m: means.b, color: "rgba(244,114,182,0.2)" }
            ].forEach(function(item) {
                for (var i = 1; i <= 3; i += 1) {
                    ctx.strokeStyle = item.color;
                    ctx.lineWidth = 1.1;
                    ctx.beginPath();
                    ctx.ellipse(ptx(item.m.x), pty(item.m.y), rx * i * 80, ry * i * 80, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        function drawAxisAlignedPartitions(levels, color) {
            var regions = [{ x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2, axis: 0 }];
            for (var d = 0; d < levels; d += 1) {
                var next = [];
                regions.forEach(function(r, idx) {
                    var split = (idx % 2 === 0) ? ((r.x0 + r.x1) * 0.5 + (Math.sin(idx + d) * 0.18)) : ((r.y0 + r.y1) * 0.5 + (Math.cos(idx + d) * 0.18));
                    if (idx % 2 === 0) {
                        next.push({ x0: r.x0, x1: split, y0: r.y0, y1: r.y1, axis: 1 });
                        next.push({ x0: split, x1: r.x1, y0: r.y0, y1: r.y1, axis: 1 });
                    } else {
                        next.push({ x0: r.x0, x1: r.x1, y0: r.y0, y1: split, axis: 0 });
                        next.push({ x0: r.x0, x1: r.x1, y0: split, y1: r.y1, axis: 0 });
                    }
                });
                regions = next;
            }

            regions.forEach(function(r, i) {
                ctx.fillStyle = i % 2 === 0 ? "rgba(56,189,248,0.12)" : "rgba(244,114,182,0.12)";
                ctx.fillRect(ptx(r.x0), pty(r.y1), Math.abs(ptx(r.x1) - ptx(r.x0)), Math.abs(pty(r.y0) - pty(r.y1)));
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.strokeRect(ptx(r.x0), pty(r.y1), Math.abs(ptx(r.x1) - ptx(r.x0)), Math.abs(pty(r.y0) - pty(r.y1)));
            });
        }

        function drawTreeGraph(treeCount, dMax) {
            return;
        }

        function drawClusteredPoints(points, labels) {
            var palette = ["#67e8f9", "#fda4af", "#86efac", "#fde68a", "#a5b4fc", "#f9a8d4"];
            points.forEach(function(p, idx) {
                var l = labels[idx];
                var color = l < 0 ? "#f87171" : palette[l % palette.length];
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(ptx(p.x), pty(p.y), 3.4, 0, Math.PI * 2);
                ctx.fill();

                if (l < 0) {
                    ctx.strokeStyle = "rgba(248, 113, 113, 0.95)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(ptx(p.x), pty(p.y), 6.4, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        function drawAnomalyPoints(points, scoreFn, threshold) {
            points.forEach(function(p) {
                var s = scoreFn(p);
                var isAnomaly = s > threshold;
                ctx.fillStyle = isAnomaly ? "#f87171" : (p.c === 1 ? "#fda4af" : "#7dd3fc");
                ctx.beginPath();
                ctx.arc(ptx(p.x), pty(p.y), isAnomaly ? 4.2 : 3.1, 0, Math.PI * 2);
                ctx.fill();

                if (isAnomaly) {
                    ctx.strokeStyle = "rgba(248, 113, 113, 0.92)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(ptx(p.x), pty(p.y), 7.2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        function fitMeans() {
            var a = { x: 0, y: 0, n: 0 };
            var b = { x: 0, y: 0, n: 0 };
            classData.forEach(function(p) {
                if (p.c === 0) { a.x += p.x; a.y += p.y; a.n += 1; }
                else { b.x += p.x; b.y += p.y; b.n += 1; }
            });
            return {
                a: { x: a.x / Math.max(1, a.n), y: a.y / Math.max(1, a.n) },
                b: { x: b.x / Math.max(1, b.n), y: b.y / Math.max(1, b.n) }
            };
        }

        function drawDemo() {
            var chosen = algo.value;
            var depthVal = parseInt(depth.value, 10) || 3;
            var forestVal = parseInt(forestTrees.value, 10) || 7;
            imbalanceValue.textContent = String(parseInt(imbalance.value, 10) || 50) + "%";
            splitValue.textContent = String(parseInt(split.value, 10) || 80) + "%";
            ctx.clearRect(0, 0, w, h);
            drawCanvasBackdrop();
            depthValue.textContent = String(depthVal);
            forestValue.textContent = String(forestVal);
            liveNote.textContent = "Live scenario mode: preset " + preset.value + ", split " + splitValue.textContent + ", noise " + noise.value + ".";

            var isTreeFamily = (
                chosen === "decision-tree" ||
                chosen === "random-forest" ||
                chosen === "extra-trees" ||
                chosen === "xgboost" ||
                chosen === "lightgbm" ||
                chosen === "catboost" ||
                chosen === "adaboost" ||
                chosen === "isolation-forest"
            );
            depthLabel.style.display = isTreeFamily ? "" : "none";
            depth.style.display = isTreeFamily ? "" : "none";
            forestLabel.style.display = isTreeFamily ? "" : "none";
            forestTrees.style.display = isTreeFamily ? "" : "none";

            if (chosen === "decision-tree") {
                depthLabel.firstChild.nodeValue = "Tree Depth: ";
                forestLabel.firstChild.nodeValue = "Tree Count: ";
            } else if (chosen === "random-forest" || chosen === "extra-trees") {
                depthLabel.firstChild.nodeValue = "Tree Depth: ";
                forestLabel.firstChild.nodeValue = "Forest Trees: ";
            } else if (chosen === "xgboost" || chosen === "lightgbm" || chosen === "catboost" || chosen === "adaboost") {
                depthLabel.firstChild.nodeValue = "Weak Learner Depth: ";
                forestLabel.firstChild.nodeValue = "Boosting Rounds: ";
            }

            if (chosen === "linear-regression" || chosen === "ridge" || chosen === "lasso" || chosen === "elastic-net" || chosen === "gp-regressor") {
                ctx.strokeStyle = "rgba(148,163,184,0.28)";
                ctx.beginPath();
                ctx.moveTo(0, h * 0.5);
                ctx.lineTo(w, h * 0.5);
                ctx.stroke();

                regData.forEach(function(p) {
                    ctx.fillStyle = "#67e8f9";
                    ctx.beginPath();
                    ctx.arc(ptx(p.x), pty(p.y), 2.8, 0, Math.PI * 2);
                    ctx.fill();
                });

                var sx = 0, sy = 0, sxy = 0, sxx = 0, n = regData.length;
                regData.forEach(function(p) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
                var model = { m: (n * sxy - sx * sy) / Math.max(1e-6, (n * sxx - sx * sx)), b: (sy / Math.max(1, n)) };
                if (chosen === "ridge") model = fitRidge(regData, 0.8);
                else if (chosen === "lasso") model = fitLasso(regData, 0.08);
                else if (chosen === "elastic-net") model = fitElasticNet(regData, 0.06, 0.6);
                else if (chosen === "gp-regressor") model = null;

                var m = model ? model.m : 0;
                var b0 = model ? model.b : 0;
                if (model) {
                    var mxReg = sx / Math.max(1, n);
                    var myReg = sy / Math.max(1, n);
                    b0 = myReg - m * mxReg;
                }
                var ssTot = 0;
                var yMean = sy / Math.max(1, n);
                var ssRes = 0;
                var absErr = 0;
                regData.forEach(function(p) {
                    var pred = chosen === "gp-regressor" ? scoreGaussianProcessRegressor(regData, p.x, 0.28 + (parseInt(noise.value, 10) / 110)) : (m * p.x + b0);
                    ssTot += (p.y - yMean) * (p.y - yMean);
                    ssRes += (p.y - pred) * (p.y - pred);
                    absErr += Math.abs(p.y - pred);
                });
                var r2 = 1 - (ssRes / Math.max(1e-6, ssTot));
                var mae = absErr / Math.max(1, n);
                var rmse = Math.sqrt(ssRes / Math.max(1, n));
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 2;
                if (chosen === "gp-regressor") {
                    ctx.beginPath();
                    for (var gx = -1; gx <= 1.0001; gx += 0.04) {
                        var gy = scoreGaussianProcessRegressor(regData, gx, 0.28 + (parseInt(noise.value, 10) / 110));
                        if (gx <= -0.99) ctx.moveTo(ptx(gx), pty(gy));
                        else ctx.lineTo(ptx(gx), pty(gy));
                    }
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(ptx(-1), pty(m * -1 + b0));
                    ctx.lineTo(ptx(1), pty(m * 1 + b0));
                    ctx.stroke();
                }

                if (chosen === "linear-regression") {
                    status.textContent = "Linear Regression: use this for forecasting trends, budgeting, and baseline explainability when relationships are mostly linear.";
                    setScenarioNote("Scenario: forecast monthly demand from historical trend + seasonality proxy under budget planning constraints.");
                    setShowcase(
                        "Forecasting numeric outcomes such as demand, cost, or sales trend.",
                        "Clean continuous targets and moderate noise where explainability matters.",
                        "Shipped as a fast baseline model before moving to complex non-linear regressors."
                    );
                } else if (chosen === "ridge") {
                    status.textContent = "Ridge Regression: use this when multicollinearity or noisy features destabilize plain linear regression.";
                    setScenarioNote("Scenario: pricing model with correlated operational variables requiring coefficient stability.");
                    setShowcase(
                        "Linear signal exists but overfitting or coefficient variance is a concern.",
                        "Correlated tabular predictors and moderate-to-high noise conditions.",
                        "Provides stable baseline coefficients while retaining linear interpretability."
                    );
                } else if (chosen === "lasso") {
                    status.textContent = "Lasso Regression: use this for sparse signal selection when only a few predictors should remain active.";
                    setScenarioNote("Scenario: compact KPI forecasting where feature selection and simplicity are both required.");
                    setShowcase(
                        "You need built-in feature shrinkage and sparse coefficient patterns.",
                        "High-dimensional or noisy settings where many signals are weak.",
                        "Useful for interpretable models that naturally prune less valuable inputs."
                    );
                } else if (chosen === "elastic-net") {
                    status.textContent = "Elastic Net: use this when you need both ridge stability and lasso sparsity in one regression model.";
                    setScenarioNote("Scenario: demand modeling with correlated features and a need for compact explainable coefficients.");
                    setShowcase(
                        "You need balanced regularization for grouped and sparse feature behavior.",
                        "Correlated feature spaces with mixed strong/weak predictors.",
                        "Balances coefficient stability and feature selection in production baselines."
                    );
                } else {
                    status.textContent = "Gaussian Process Regressor: use this for smooth non-linear regression with uncertainty-aware local fit behavior.";
                    setScenarioNote("Scenario: sensor calibration and small-data forecasting where non-linear local smoothness matters.");
                    setShowcase(
                        "Data is limited and non-linear but smooth relationships are expected.",
                        "Small-to-medium regression sets where local generalization is important.",
                        "Great for high-quality, uncertainty-sensitive prototype regression workflows."
                    );
                }

                setDiagnostics("TP - | FP - | TN - | FN -", "Split " + splitValue.textContent + " | R2 " + Math.max(0, r2).toFixed(2), "coef x: " + m.toFixed(2) + " | bias: " + b0.toFixed(2));
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            var means = fitMeans();
            var dx = means.b.x - means.a.x;
            var dy = means.b.y - means.a.y;
            var mx = (means.a.x + means.b.x) * 0.5;
            var my = (means.a.y + means.b.y) * 0.5;
            var slopeDen = Math.abs(dy) < 1e-5 ? (dy < 0 ? -1e-5 : 1e-5) : dy;
            var slope = -dx / slopeDen;
            var y0 = my - slope * mx;

            function baseLinearScore(point) {
                return point.y - (slope * point.x + y0);
            }

            var orient = baseLinearScore(means.b) >= baseLinearScore(means.a) ? 1 : -1;
            function orientedLinearScore(point) {
                return baseLinearScore(point) * orient;
            }

            if (chosen === "kmeans") {
                var c1 = { x: -0.35, y: -0.2 };
                var c2 = { x: 0.35, y: 0.2 };
                for (var t = 0; t < 6; t += 1) {
                    var s1 = { x: 0, y: 0, n: 0 };
                    var s2 = { x: 0, y: 0, n: 0 };
                    classData.forEach(function(p) {
                        var d1 = (p.x - c1.x) * (p.x - c1.x) + (p.y - c1.y) * (p.y - c1.y);
                        var d2 = (p.x - c2.x) * (p.x - c2.x) + (p.y - c2.y) * (p.y - c2.y);
                        if (d1 <= d2) { s1.x += p.x; s1.y += p.y; s1.n += 1; }
                        else { s2.x += p.x; s2.y += p.y; s2.n += 1; }
                    });
                    c1.x = s1.x / Math.max(1, s1.n); c1.y = s1.y / Math.max(1, s1.n);
                    c2.x = s2.x / Math.max(1, s2.n); c2.y = s2.y / Math.max(1, s2.n);
                }

                var clusterVotes = [{ z0: 0, z1: 0 }, { z0: 0, z1: 0 }];
                classData.forEach(function(p) {
                    var d1 = (p.x - c1.x) * (p.x - c1.x) + (p.y - c1.y) * (p.y - c1.y);
                    var d2 = (p.x - c2.x) * (p.x - c2.x) + (p.y - c2.y) * (p.y - c2.y);
                    var clusterIdx = d1 <= d2 ? 0 : 1;
                    if (p.c === 1) clusterVotes[clusterIdx].z1 += 1;
                    else clusterVotes[clusterIdx].z0 += 1;
                });

                var clusterClass = [
                    clusterVotes[0].z1 >= clusterVotes[0].z0 ? 1 : 0,
                    clusterVotes[1].z1 >= clusterVotes[1].z0 ? 1 : 0
                ];

                function kmeansScore(point) {
                    var d1 = (point.x - c1.x) * (point.x - c1.x) + (point.y - c1.y) * (point.y - c1.y);
                    var d2 = (point.x - c2.x) * (point.x - c2.x) + (point.y - c2.y) * (point.y - c2.y);
                    var clusterIdx = d1 <= d2 ? 0 : 1;
                    var confidence = Math.abs(d1 - d2);
                    return clusterClass[clusterIdx] === 1 ? confidence : -confidence;
                }

                drawClassifierBoundary(kmeansScore, 0.38, "rgba(147,197,253,0.5)", "rgba(251,113,133,0.5)");
                drawPoints(classData, "#93c5fd", "#f9a8d4");
                ctx.fillStyle = "#22d3ee";
                ctx.beginPath(); ctx.arc(ptx(c1.x), pty(c1.y), 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fb7185";
                ctx.beginPath(); ctx.arc(ptx(c2.x), pty(c2.y), 7, 0, Math.PI * 2); ctx.fill();
                status.textContent = "K-Means: use this for segmentation and exploration when labels are missing and you need quick structure discovery.";
                setScenarioNote("Scenario: user-behavior segmentation for lifecycle campaigns before labels are available.");
                setShowcase(
                    "No labels yet, but you need to group users/items into natural segments.",
                    "Early-stage customer segmentation, anomaly triage, and cold-start clustering.",
                    "Turns raw data into actionable cohorts for product strategy in days, not weeks."
                );
                var kmEval = evaluateClassifier(kmeansScore);
                setDiagnostics("TP " + kmEval.tp + " | FP " + kmEval.fp + " | TN " + kmEval.tn + " | FN " + kmEval.fn, "Split " + splitValue.textContent + " | Purity " + Math.max(kmEval.acc, kmEval.f1).toFixed(2), "centroids: 2 | preset: " + preset.value);
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            if (chosen === "knn") {
                function knnScore(point) {
                    var dists = classData.map(function(p) {
                        var dxp = p.x - point.x;
                        var dyp = p.y - point.y;
                        return { c: p.c, d: Math.sqrt(dxp * dxp + dyp * dyp) };
                    }).sort(function(a, b) { return a.d - b.d; });
                    var k = 7;
                    var vote = 0;
                    for (var i = 0; i < Math.min(k, dists.length); i += 1) {
                        vote += dists[i].c === 1 ? 1 : -1;
                    }
                    return vote / Math.max(1, k);
                }
                var knnMetrics = evaluateClassifier(knnScore);
                drawClassifierBoundary(knnScore, 0.45, "rgba(56,189,248,0.55)", "rgba(244,114,182,0.55)");
                drawPoints(classData, "#7dd3fc", "#fda4af");
                status.textContent = "KNN: use this when local similarity drives decisions and you want an intuitive non-parametric baseline.";
                setScenarioNote("Scenario: nearest-neighbor recommendation or fraud similarity triage with explainable local matches.");
                setShowcase(
                    "Decision boundaries are irregular and nearby examples matter most.",
                    "Low-dimensional tabular tasks with manageable data size and good scaling.",
                    "Great benchmark for proving local-pattern signal before model complexity increases."
                );
                setDiagnostics("TP " + knnMetrics.tp + " | FP " + knnMetrics.fp + " | TN " + knnMetrics.tn + " | FN " + knnMetrics.fn, "Split " + splitValue.textContent + " | AUC " + knnMetrics.auc.toFixed(2), "k: 7 | scale: " + (scaleFeatures.checked ? "on" : "off"));
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            if (chosen === "naive-bayes") {
                var nbStats = fitNaiveBayesStats();
                function nbScore(point) {
                    return naiveBayesScore(nbStats, point);
                }
                var nbMetrics = evaluateClassifier(nbScore);
                drawClassifierBoundary(nbScore, 0.28, "rgba(56,189,248,0.36)", "rgba(244,114,182,0.36)");
                drawGaussianEllipses();
                drawPoints(classData, "#67e8f9", "#fda4af");
                status.textContent = "Naive Bayes: use this when you need fast probabilistic decisions with small data and strong feature independence assumptions.";
                setScenarioNote("Scenario: email/spam or ticket routing where rapid probabilistic scoring is preferred over heavy training.");
                setShowcase(
                    "You need quick probability estimates and interpretable class confidence.",
                    "Text/NLP and sparse-feature problems where speed beats heavy tuning.",
                    "Useful for lightweight production services where latency and simplicity are critical."
                );
                setDiagnostics("TP " + nbMetrics.tp + " | FP " + nbMetrics.fp + " | TN " + nbMetrics.tn + " | FN " + nbMetrics.fn, "Split " + splitValue.textContent + " | AUC " + nbMetrics.auc.toFixed(2), "var x/y: " + nbStats.c1.vx.toFixed(2) + "/" + nbStats.c1.vy.toFixed(2));
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            if (chosen === "gp-classifier") {
                var gpLen = 0.25 + (parseInt(noise.value, 10) || 12) / 120;
                function gpClsScore(point) {
                    return scoreGaussianProcessClassifier(trainData.length ? trainData : classData, point, gpLen);
                }
                var gpMetrics = evaluateClassifier(gpClsScore);
                drawClassifierBoundary(gpClsScore, 0.33, "rgba(56, 189, 248, 0.34)", "rgba(167, 139, 250, 0.34)");
                drawPoints(classData, "#7dd3fc", "#c4b5fd");
                status.textContent = "Gaussian Process Classifier: use this for smooth non-linear boundaries with small-to-medium data.";
                setScenarioNote("Scenario: medical triage prototype where local smoothness and calibrated behavior matter more than raw scale.");
                setShowcase(
                    "You need flexible smooth boundaries without heavy feature engineering.",
                    "Small/medium datasets where local similarity carries strong predictive signal.",
                    "Excellent for high-trust prototypes requiring nuanced non-linear separation."
                );
                setDiagnostics("TP " + gpMetrics.tp + " | FP " + gpMetrics.fp + " | TN " + gpMetrics.tn + " | FN " + gpMetrics.fn, "Split " + splitValue.textContent + " | AUC " + gpMetrics.auc.toFixed(2), "kernel length: " + gpLen.toFixed(2));
                return;
            }

            if (chosen === "lda") {
                var ldaModel = fitLDA(trainData.length ? trainData : classData);
                function ldaScore(point) {
                    return scoreLDA(ldaModel, point);
                }
                var ldaMetrics = evaluateClassifier(ldaScore);
                drawClassifierBoundary(ldaScore, 0.3, "rgba(6, 182, 212, 0.3)", "rgba(249, 168, 212, 0.3)");
                drawPoints(classData, "#67e8f9", "#f9a8d4");
                status.textContent = "LDA: use this when class covariances are similar and you want a strong linear discriminative baseline.";
                setScenarioNote("Scenario: customer response classification where simple linear class separation is sufficient.");
                setShowcase(
                    "Class structure is approximately linear with comparable covariance patterns.",
                    "Fast baseline classification with interpretable discriminative direction.",
                    "Reliable low-latency classifier for straightforward binary decisions."
                );
                setDiagnostics("TP " + ldaMetrics.tp + " | FP " + ldaMetrics.fp + " | TN " + ldaMetrics.tn + " | FN " + ldaMetrics.fn, "Split " + splitValue.textContent + " | AUC " + ldaMetrics.auc.toFixed(2), "w x: " + ldaModel.wx.toFixed(2) + " | w y: " + ldaModel.wy.toFixed(2));
                return;
            }

            if (chosen === "qda") {
                var qdaModel = fitQDA(trainData.length ? trainData : classData);
                function qdaScore(point) {
                    return scoreQDA(qdaModel, point);
                }
                var qdaMetrics = evaluateClassifier(qdaScore);
                drawClassifierBoundary(qdaScore, 0.32, "rgba(34, 197, 94, 0.3)", "rgba(251, 146, 60, 0.3)");
                drawPoints(classData, "#86efac", "#fdba74");
                status.textContent = "QDA: use this when each class has distinct covariance shape and the boundary is truly non-linear.";
                setScenarioNote("Scenario: fraud/non-fraud with asymmetric spread where class variance structures differ by segment.");
                setShowcase(
                    "Classes have different covariance geometry requiring curved boundaries.",
                    "Moderate tabular datasets where Gaussian class assumptions are acceptable.",
                    "Captures non-linear separation while retaining probabilistic interpretation."
                );
                setDiagnostics("TP " + qdaMetrics.tp + " | FP " + qdaMetrics.fp + " | TN " + qdaMetrics.tn + " | FN " + qdaMetrics.fn, "Split " + splitValue.textContent + " | AUC " + qdaMetrics.auc.toFixed(2), "det0: " + qdaModel.c0.det.toFixed(3) + " | det1: " + qdaModel.c1.det.toFixed(3));
                return;
            }

            if (chosen === "xgboost") {
                var xgbModel = fitGradientBoostedStumps(trainData.length ? trainData : classData, Math.max(6, forestVal), "xgboost");
                function xgbScore(point) {
                    return scoreGradientBoosting(xgbModel, point);
                }
                var xgbMetrics = evaluateClassifier(xgbScore);
                drawClassifierBoundary(xgbScore, 0.35, "rgba(37, 99, 235, 0.34)", "rgba(245, 158, 11, 0.35)");
                drawPoints(classData, "#7dd3fc", "#fda4af");
                drawBoostingInset(xgbModel, "XGBoost", "rgba(245, 158, 11, 0.55)");
                status.textContent = "XGBoost: use this for high-accuracy tabular tasks where performance and controlled regularization matter.";
                setScenarioNote("Scenario: fraud scoring with asymmetric risk, where precision-recall tradeoffs need strong gradient-boosted ranking.");
                setShowcase(
                    "You need top-tier tabular accuracy with robust handling of non-linearity.",
                    "Medium-to-large feature-rich datasets with complex interactions.",
                    "Often production winner when business KPI optimization beats simple model interpretability."
                );
                setDiagnostics("TP " + xgbMetrics.tp + " | FP " + xgbMetrics.fp + " | TN " + xgbMetrics.tn + " | FN " + xgbMetrics.fn, "Split " + splitValue.textContent + " | AUC " + xgbMetrics.auc.toFixed(2), "gain x: " + xgbModel.importance.x.toFixed(2) + " | gain y: " + xgbModel.importance.y.toFixed(2));
                return;
            }

            if (chosen === "lightgbm") {
                var lgbmModel = fitGradientBoostedStumps(trainData.length ? trainData : classData, Math.max(6, forestVal), "lightgbm");
                function lgbmScore(point) {
                    return scoreGradientBoosting(lgbmModel, point);
                }
                var lgbmMetrics = evaluateClassifier(lgbmScore);
                drawClassifierBoundary(lgbmScore, 0.35, "rgba(14, 116, 144, 0.34)", "rgba(34, 197, 94, 0.34)");
                drawPoints(classData, "#7dd3fc", "#86efac");
                drawBoostingInset(lgbmModel, "LightGBM", "rgba(34, 197, 94, 0.55)");
                status.textContent = "LightGBM: use this for fast, strong boosting on large tabular datasets with aggressive iteration speed.";
                setScenarioNote("Scenario: near-real-time lead scoring where model retraining cadence and low-latency updates are important.");
                setShowcase(
                    "You need boosted performance with faster training and deployment cycles.",
                    "Large tabular workloads where throughput and quick iteration are critical.",
                    "Excellent for teams optimizing both model quality and engineering velocity."
                );
                setDiagnostics("TP " + lgbmMetrics.tp + " | FP " + lgbmMetrics.fp + " | TN " + lgbmMetrics.tn + " | FN " + lgbmMetrics.fn, "Split " + splitValue.textContent + " | AUC " + lgbmMetrics.auc.toFixed(2), "gain x: " + lgbmModel.importance.x.toFixed(2) + " | gain y: " + lgbmModel.importance.y.toFixed(2));
                return;
            }

            if (chosen === "catboost") {
                var catModel = fitGradientBoostedStumps(trainData.length ? trainData : classData, Math.max(6, forestVal), "catboost");
                function catScore(point) {
                    return scoreGradientBoosting(catModel, point);
                }
                var catMetrics = evaluateClassifier(catScore);
                drawClassifierBoundary(catScore, 0.35, "rgba(30, 64, 175, 0.34)", "rgba(217, 70, 239, 0.34)");
                drawPoints(classData, "#a5b4fc", "#f9a8d4");
                drawBoostingInset(catModel, "CatBoost", "rgba(217, 70, 239, 0.55)");
                status.textContent = "CatBoost: use this when categorical-heavy features need strong boosted performance with stable training.";
                setScenarioNote("Scenario: customer propensity modeling with many categorical dimensions like channel, region, and campaign metadata.");
                setShowcase(
                    "Categorical features dominate and manual encoding overhead must stay low.",
                    "Business tabular datasets with mixed numerical and category-heavy columns.",
                    "Delivers strong accuracy while reducing category engineering friction."
                );
                setDiagnostics("TP " + catMetrics.tp + " | FP " + catMetrics.fp + " | TN " + catMetrics.tn + " | FN " + catMetrics.fn, "Split " + splitValue.textContent + " | AUC " + catMetrics.auc.toFixed(2), "gain x: " + catModel.importance.x.toFixed(2) + " | gain y: " + catModel.importance.y.toFixed(2));
                return;
            }

            if (chosen === "extra-trees") {
                var etForest = fitExtraTrees(trainData.length ? trainData : classData, forestVal, depthVal);
                function etScore(point) {
                    return forestScore(etForest, point);
                }
                var etMetrics = evaluateClassifier(etScore);
                drawClassifierBoundary(etScore, 0.31, "rgba(14, 116, 144, 0.35)", "rgba(244, 114, 182, 0.34)");
                drawPoints(classData, "#67e8f9", "#fda4af");
                drawTreeInset(etForest, "Extra Trees", depthVal, forestVal);
                var etImportance = { x: 0, y: 0 };
                etForest.forEach(function(t) { collectTreeImportance(t, etImportance); });
                status.textContent = "Extra Trees: use this for fast, variance-reducing ensembles with highly randomized splits.";
                setScenarioNote("Scenario: rapid baseline on noisy operational data when you want ensemble robustness with minimal tuning.");
                setShowcase(
                    "You want tree-ensemble stability with stronger randomness to combat overfitting.",
                    "Noisy tabular datasets where variance reduction improves generalization.",
                    "Great low-maintenance ensemble baseline before advanced boosting."
                );
                setDiagnostics("TP " + etMetrics.tp + " | FP " + etMetrics.fp + " | TN " + etMetrics.tn + " | FN " + etMetrics.fn, "Split " + splitValue.textContent + " | AUC " + etMetrics.auc.toFixed(2), "split x: " + etImportance.x + " | split y: " + etImportance.y);
                return;
            }

            if (chosen === "adaboost") {
                var adaModel = fitAdaBoostStumps(trainData.length ? trainData : classData, Math.max(6, forestVal));
                function adaScore(point) {
                    return scoreAdaBoost(adaModel, point);
                }
                var adaMetrics = evaluateClassifier(adaScore);
                drawClassifierBoundary(adaScore, 0.35, "rgba(56, 189, 248, 0.32)", "rgba(249, 115, 22, 0.34)");
                drawPoints(classData, "#7dd3fc", "#fdba74");
                drawBoostingInset(adaModel, "AdaBoost", "rgba(249, 115, 22, 0.6)");
                status.textContent = "AdaBoost: use this when weak learners can be sequentially focused on hard misclassified cases.";
                setScenarioNote("Scenario: imbalanced defect triage where iterative emphasis on hard samples improves recall.");
                setShowcase(
                    "You need a focused ensemble that progressively corrects hard mistakes.",
                    "Moderate-sized tabular tasks with clear weak-learner improvements.",
                    "Provides interpretable boosting progression and focused error correction."
                );
                setDiagnostics("TP " + adaMetrics.tp + " | FP " + adaMetrics.fp + " | TN " + adaMetrics.tn + " | FN " + adaMetrics.fn, "Split " + splitValue.textContent + " | AUC " + adaMetrics.auc.toFixed(2), "alpha x: " + adaModel.importance.x.toFixed(2) + " | alpha y: " + adaModel.importance.y.toFixed(2));
                return;
            }

            if (chosen === "dbscan") {
                var eps = 0.22 + (parseInt(noise.value, 10) || 12) * 0.003;
                var minPts = 5;
                var db = runDbscan(trainData.length ? trainData : classData, eps, minPts);
                // Rebuild labels for full view set so points and labels align.
                var dbAll = runDbscan(classData, eps, minPts);
                drawClusteredPoints(classData, dbAll.labels);
                status.textContent = "DBSCAN: use this for density-based clustering with explicit noise detection and no preset cluster count.";
                setScenarioNote("Scenario: geo-behavior clustering where sparse events should be flagged as noise, not forced into clusters.");
                setShowcase(
                    "You need cluster discovery with outlier handling in irregular density data.",
                    "Spatial, behavioral, or event stream patterns with noisy points.",
                    "Finds organic groups and preserves anomaly structure in one pass."
                );
                var dbNoise = db.labels.filter(function(l) { return l < 0; }).length;
                setDiagnostics("TP - | FP - | TN - | FN -", "Split " + splitValue.textContent + " | clusters " + db.clusters, "eps: " + eps.toFixed(2) + " | noise pts: " + dbNoise);
                return;
            }

            if (chosen === "agglomerative") {
                var ag = runAgglomerative(classData, 2);
                drawClusteredPoints(classData, ag.labels);
                status.textContent = "Hierarchical Agglomerative Clustering: use this to reveal nested grouping structure through progressive merges.";
                setScenarioNote("Scenario: customer cohorting where teams need hierarchical roll-ups from micro-segments to macro-groups.");
                setShowcase(
                    "You need hierarchy-aware clustering and staged granularity exploration.",
                    "Segmentation workflows where nested cluster interpretation is valuable.",
                    "Supports strategic roll-up views from fine-grained to broad cohorts."
                );
                setDiagnostics("TP - | FP - | TN - | FN -", "Split " + splitValue.textContent + " | clusters " + ag.clusters, "merge target k: 2 | linkage: centroid");
                return;
            }

            if (chosen === "one-class-svm") {
                var ocsvm = fitOneClassBoundary(trainData.length ? trainData : classData, 0.08 + (parseInt(noise.value, 10) / 500));
                function ocsvmScore(point) {
                    return -scoreOneClassBoundary(ocsvm, point);
                }
                var thr = 0;
                drawAnomalyPoints(classData, ocsvmScore, thr);
                // draw boundary circle
                ctx.strokeStyle = "rgba(248, 113, 113, 0.7)";
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(ptx(ocsvm.mx), pty(ocsvm.my), Math.max(8, (ocsvm.radius / 2.4) * w), 0, Math.PI * 2);
                ctx.stroke();
                status.textContent = "One-Class SVM (anomaly): use this when normal behavior is known and rare deviations must be detected.";
                setScenarioNote("Scenario: transaction monitoring where anomaly alerts are driven by deviations from learned normal profiles.");
                setShowcase(
                    "You mainly model normal behavior and detect boundary violations.",
                    "Anomaly workflows with sparse labels and high false-negative cost.",
                    "Delivers practical unsupervised alerting for early risk detection."
                );
                var ocAnom = classData.filter(function(p) { return ocsvmScore(p) > thr; }).length;
                setDiagnostics("TP - | FP - | TN - | FN -", "Split " + splitValue.textContent + " | anomalies " + ocAnom, "radius: " + ocsvm.radius.toFixed(2) + " | nu: dynamic");
                return;
            }

            if (chosen === "isolation-forest") {
                var isoModel = fitIsolationForest(trainData.length ? trainData : classData, Math.max(8, forestVal), Math.max(4, depthVal + 2));
                function isoScore(point) {
                    return scoreIsolationForest(isoModel, point);
                }
                var isoScores = classData.map(function(p) { return isoScore(p); }).sort(function(a, b) { return a - b; });
                var idxThr = Math.max(0, Math.min(isoScores.length - 1, Math.floor(0.86 * isoScores.length)));
                var isoThr = isoScores[idxThr];
                drawAnomalyPoints(classData, isoScore, isoThr);
                drawTreeInset(isoModel.trees, "Isolation Forest", Math.max(4, depthVal + 2), Math.max(8, forestVal));
                status.textContent = "Isolation Forest: use this for scalable anomaly detection where short isolation paths indicate suspicious points.";
                setScenarioNote("Scenario: platform abuse detection where anomalous behavior should be quickly isolated in high-volume logs.");
                setShowcase(
                    "You need anomaly ranking without labeled fraud examples.",
                    "Large-scale event data with evolving abnormal patterns.",
                    "Scales well and surfaces anomalies via interpretable path-length intuition."
                );
                var isoAnom = classData.filter(function(p) { return isoScore(p) > isoThr; }).length;
                setDiagnostics("TP - | FP - | TN - | FN -", "Split " + splitValue.textContent + " | anomalies " + isoAnom, "trees: " + isoModel.trees.length + " | depth: " + isoModel.maxDepth);
                return;
            }

            if (chosen === "decision-tree") {
                var tree = fitDecisionTree(trainData.length ? trainData : classData, depthVal);
                function treePredictScore(point) {
                    return treeScore(tree, point);
                }
                var treeMetrics = evaluateClassifier(treePredictScore);
                drawClassifierBoundary(treePredictScore, 0.34, "rgba(56,189,248,0.42)", "rgba(251,113,133,0.42)");
                drawPoints(classData, "#7dd3fc", "#fda4af");
                status.textContent = "Decision Tree: use this when you need transparent business rules and simple explainability for stakeholders.";
                setScenarioNote("Scenario: policy-driven risk screening where decisions must be auditable and rule-like.");
                setShowcase(
                    "Rule-based decisions are needed for audits, policy, or domain explainability.",
                    "Structured tabular data with non-linear interactions and mixed feature scales.",
                    "Converts model logic into readable if/else decisions for leadership and compliance."
                );
                var dtImportance = { x: 0, y: 0 };
                collectTreeImportance(tree, dtImportance);
                drawTreeInset([tree], "Decision Tree", depthVal, 1);
                setDiagnostics("TP " + treeMetrics.tp + " | FP " + treeMetrics.fp + " | TN " + treeMetrics.tn + " | FN " + treeMetrics.fn, "Split " + splitValue.textContent + " | AUC " + treeMetrics.auc.toFixed(2), "split x: " + dtImportance.x + " | split y: " + dtImportance.y);
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            if (chosen === "random-forest") {
                var forest = fitRandomForest(trainData.length ? trainData : classData, forestVal, depthVal);
                function forestPredictScore(point) {
                    return forestScore(forest, point);
                }
                var forestMetrics = evaluateClassifier(forestPredictScore);
                drawClassifierBoundary(forestPredictScore, 0.31, "rgba(56,189,248,0.38)", "rgba(244,114,182,0.38)");
                drawPoints(classData, "#7dd3fc", "#fda4af");
                status.textContent = "Random Forest: use this when you need robust accuracy quickly on tabular data with minimal heavy feature engineering.";
                setScenarioNote("Scenario: churn and fraud scoring on noisy production tabular data with mixed feature quality.");
                setShowcase(
                    "You want strong out-of-the-box performance and resistance to overfitting.",
                    "Production tabular pipelines with noisy features and non-linear boundaries.",
                    "Reliable candidate for real business classification tasks before boosting stacks."
                );
                var rfImportance = { x: 0, y: 0 };
                forest.forEach(function(tree) {
                    collectTreeImportance(tree, rfImportance);
                });
                drawTreeInset(forest, "Random Forest", depthVal, forestVal);
                setDiagnostics("TP " + forestMetrics.tp + " | FP " + forestMetrics.fp + " | TN " + forestMetrics.tn + " | FN " + forestMetrics.fn, "Split " + splitValue.textContent + " | AUC " + forestMetrics.auc.toFixed(2), "split x: " + rfImportance.x + " | split y: " + rfImportance.y);
                drawTreeGraph(forestVal, depthVal);
                return;
            }

            drawClassifierBoundary(orientedLinearScore, 0.22, "rgba(56,189,248,0.34)", "rgba(244,114,182,0.34)");
            ctx.strokeStyle = "#22d3ee";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ptx(-1.2), pty(slope * -1.2 + y0));
            ctx.lineTo(ptx(1.2), pty(slope * 1.2 + y0));
            ctx.stroke();

            if (chosen === "svm") {
                var svmMetrics = evaluateClassifier(orientedLinearScore);
                ctx.strokeStyle = "rgba(56,189,248,0.55)";
                ctx.setLineDash([6, 5]);
                ctx.beginPath(); ctx.moveTo(ptx(-1.2), pty(slope * -1.2 + y0 + 0.18)); ctx.lineTo(ptx(1.2), pty(slope * 1.2 + y0 + 0.18)); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ptx(-1.2), pty(slope * -1.2 + y0 - 0.18)); ctx.lineTo(ptx(1.2), pty(slope * 1.2 + y0 - 0.18)); ctx.stroke();
                ctx.setLineDash([]);
                status.textContent = "SVM: use this when margin separation is clear and you want strong boundaries on medium-scale datasets.";
                setScenarioNote("Scenario: quality-control classification with sharp class boundaries and strict false-positive costs.");
                setShowcase(
                    "Classes are separable with a stable boundary and you care about margin quality.",
                    "High-signal classification with normalized features and moderate sample sizes.",
                    "Excellent interview/demo model to explain geometric intuition and robustness."
                );
                setDiagnostics("TP " + svmMetrics.tp + " | FP " + svmMetrics.fp + " | TN " + svmMetrics.tn + " | FN " + svmMetrics.fn, "Split " + splitValue.textContent + " | AUC " + svmMetrics.auc.toFixed(2), "margin bands: +/-0.18");
            } else {
                var logMetrics = evaluateClassifier(orientedLinearScore);
                status.textContent = "Logistic Regression: use this for interpretable binary classification and fast deployment baselines.";
                setScenarioNote("Scenario: conversion propensity scoring where probability calibration and feature influence are essential.");
                setShowcase(
                    "You need calibrated probability outputs and clear feature impact direction.",
                    "Risk scoring, conversion prediction, and binary operational decisions.",
                    "Strong baseline that demonstrates model discipline and business alignment."
                );
                setDiagnostics("TP " + logMetrics.tp + " | FP " + logMetrics.fp + " | TN " + logMetrics.tn + " | FN " + logMetrics.fn, "Split " + splitValue.textContent + " | AUC " + logMetrics.auc.toFixed(2), "line slope: " + slope.toFixed(2) + " | intercept: " + y0.toFixed(2));
            }

            drawPoints(classData, "#7dd3fc", "#fda4af");
            drawTreeGraph(forestVal, depthVal);
        }

        function rerun() {
            genData();
            drawDemo();
        }

        algo.addEventListener("change", function() {
            pauseAutoNoise(2600);
            drawDemo();
        });
        noise.addEventListener("input", function() {
            pauseAutoNoise(4200);
            rerun();
        });
        noise.addEventListener("change", function() {
            pauseAutoNoise(4200);
            rerun();
        });
        noise.addEventListener("pointerdown", function() {
            pauseAutoNoise(4200);
        });
        noise.addEventListener("touchstart", function() {
            pauseAutoNoise(4200);
        }, { passive: true });
        depth.addEventListener("input", function() {
            pauseAutoNoise(2600);
            drawDemo();
        });
        forestTrees.addEventListener("input", function() {
            pauseAutoNoise(2600);
            drawDemo();
        });
        preset.addEventListener("change", function() {
            pauseAutoNoise(2600);
            rerun();
        });
        imbalance.addEventListener("input", function() {
            pauseAutoNoise(2200);
            rerun();
        });
        split.addEventListener("input", function() {
            pauseAutoNoise(2200);
            rerun();
        });
        outliers.addEventListener("change", function() {
            pauseAutoNoise(2200);
            rerun();
        });
        scaleFeatures.addEventListener("change", function() {
            pauseAutoNoise(2200);
            rerun();
        });
        noiseSpeed.addEventListener("change", function() {
            var v = noiseSpeed.value;
            if (v === "slow") noiseIntervalMs = 860;
            else if (v === "fast") noiseIntervalMs = 360;
            else noiseIntervalMs = 620;
            startNoiseAutoFlow();
        });
        noiseToggle.addEventListener("click", function() {
            autoNoiseEnabled = !autoNoiseEnabled;
            noiseToggle.textContent = autoNoiseEnabled ? "Pause Noise" : "Resume Noise";
            if (autoNoiseEnabled) pauseAutoNoise(800);
        });
        regenerate.addEventListener("click", function() {
            pauseAutoNoise(2600);
            rerun();
        });
        window.addEventListener("resize", function() { sizeCanvas(); drawDemo(); }, { passive: true });
        window.addEventListener("beforeunload", function() {
            if (noiseAutoTimer) window.clearInterval(noiseAutoTimer);
        });

        sizeCanvas();
        rerun();
        startNoiseAutoFlow();
    }

    function setupEdgeBenchmarkDemo() {
        var canvas = document.getElementById("sort-demo-canvas");
        var algo = document.getElementById("sort-algo");
        var pattern = document.getElementById("sort-pattern");
        var size = document.getElementById("sort-size");
        var sizeValue = document.getElementById("sort-size-value");
        var speed = document.getElementById("sort-speed");
        var speedValue = document.getElementById("sort-speed-value");
        var runBtn = document.getElementById("sort-run");
        var shuffleBtn = document.getElementById("sort-shuffle");
        var useWhen = document.getElementById("sort-use-when");
        var bestFit = document.getElementById("sort-best-fit");
        var impact = document.getElementById("sort-impact");
        var complexity = document.getElementById("sort-complexity");
        var stability = document.getElementById("sort-stability");
        var comparisons = document.getElementById("sort-comparisons");
        var writes = document.getElementById("sort-writes");
        var note = document.getElementById("sort-algo-note");
        var status = document.getElementById("sort-status");
        if (!canvas || !algo || !pattern || !size || !sizeValue || !speed || !speedValue || !runBtn || !shuffleBtn || !useWhen || !bestFit || !impact || !complexity || !stability || !comparisons || !writes || !note || !status) return;

        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        var rafId = null;
        var running = false;
        var baseArray = [];
        var liveArray = [];
        var ops = [];
        var opIndex = 0;
        var compareCount = 0;
        var writeCount = 0;
        var activeA = -1;
        var activeB = -1;
        var activePivot = -1;
        var done = false;

        var algoMeta = {
            bubble: {
                useWhen: "You need simple educational visibility into swap-heavy local corrections.",
                bestFit: "Tiny arrays and teaching visual intuition for adjacent comparisons.",
                impact: "Easy to reason about, but mainly for demos and sanity checks.",
                complexity: "Best O(n), Avg O(n^2), Worst O(n^2)",
                stability: "Stable"
            },
            selection: {
                useWhen: "Write operations are expensive and you want deterministic pass behavior.",
                bestFit: "Small datasets where minimizing swaps matters more than comparisons.",
                impact: "Predictable memory usage with simple operational cost profile.",
                complexity: "Best O(n^2), Avg O(n^2), Worst O(n^2)",
                stability: "Not Stable"
            },
            insertion: {
                useWhen: "Input arrives nearly sorted and updates are incremental.",
                bestFit: "Online maintenance of ranked lists and small near-sorted buffers.",
                impact: "Fast practical behavior in low-disorder streams with stability.",
                complexity: "Best O(n), Avg O(n^2), Worst O(n^2)",
                stability: "Stable"
            },
            merge: {
                useWhen: "You require stable sort behavior with guaranteed n log n scaling.",
                bestFit: "Large data pipelines where predictable performance is mandatory.",
                impact: "Reliable production baseline for stable, throughput-aware sorting.",
                complexity: "Best O(n log n), Avg O(n log n), Worst O(n log n)",
                stability: "Stable"
            },
            quick: {
                useWhen: "Average-case speed is critical and in-place sorting is preferred.",
                bestFit: "General-purpose in-memory sorting with randomized or mixed inputs.",
                impact: "Excellent practical throughput when pivot behavior is healthy.",
                complexity: "Best O(n log n), Avg O(n log n), Worst O(n^2)",
                stability: "Not Stable"
            },
            heap: {
                useWhen: "You need bounded worst-case performance with in-place memory usage.",
                bestFit: "Systems requiring deterministic n log n without extra merge buffers.",
                impact: "Strong reliability under adversarial input distributions.",
                complexity: "Best O(n log n), Avg O(n log n), Worst O(n log n)",
                stability: "Not Stable"
            },
            counting: {
                useWhen: "Keys are bounded integers and linear-time throughput is needed.",
                bestFit: "Large event batches with known value range and duplicate-heavy distributions.",
                impact: "Excellent for high-volume integer sorting in ETL and telemetry preprocessing.",
                complexity: "Best O(n + k), Avg O(n + k), Worst O(n + k)",
                stability: "Stable"
            },
            radix: {
                useWhen: "Integer keys are available and you need predictable linear digit passes.",
                bestFit: "IDs, timestamps, and numeric fields where comparison overhead hurts latency.",
                impact: "Scales cleanly on large integer streams with stable bucket passes.",
                complexity: "Best O(d(n + b)), Avg O(d(n + b)), Worst O(d(n + b))",
                stability: "Stable"
            }
        };

        function setMeta() {
            var meta = algoMeta[algo.value] || algoMeta.insertion;
            useWhen.textContent = meta.useWhen;
            bestFit.textContent = meta.bestFit;
            impact.textContent = meta.impact;
            complexity.textContent = meta.complexity;
            stability.textContent = meta.stability;
            var scenario = {
                bubble: "Scenario: teach junior engineers why local swap strategies degrade on large random feeds.",
                selection: "Scenario: embedded ranking pass where flash writes are constrained but comparisons are cheap.",
                insertion: "Scenario: maintain sorted transaction priorities as new records stream in continuously.",
                merge: "Scenario: nightly ETL merge pipeline requiring stable deterministic ordering at scale.",
                quick: "Scenario: API-side fast in-memory sort for user-facing leaderboards under latency pressure.",
                heap: "Scenario: reliability-critical backend where adversarial ordering must not break throughput.",
                counting: "Scenario: rank integer risk scores quickly during high-volume fraud stream preprocessing.",
                radix: "Scenario: sort massive numeric identifiers in ingestion pipelines with tight latency budgets."
            };
            note.textContent = scenario[algo.value] || scenario.insertion;
        }

        function clamp(v, a, b) {
            return Math.max(a, Math.min(b, v));
        }

        function generateArray(n, mode) {
            var arr = [];
            var i;
            if (mode === "reversed") {
                for (i = 0; i < n; i++) arr.push(n - i);
            } else if (mode === "nearly") {
                for (i = 0; i < n; i++) arr.push(i + 1);
                for (i = 0; i < Math.max(1, Math.floor(n * 0.08)); i++) {
                    var a = Math.floor(Math.random() * n);
                    var b = Math.floor(Math.random() * n);
                    var t = arr[a]; arr[a] = arr[b]; arr[b] = t;
                }
            } else if (mode === "few-unique") {
                for (i = 0; i < n; i++) arr.push(8 + Math.floor(Math.random() * 12) * 4);
            } else {
                for (i = 0; i < n; i++) arr.push(8 + Math.floor(Math.random() * 52));
            }
            return arr;
        }

        function resetDataset() {
            var n = parseInt(size.value, 10) || 56;
            sizeValue.textContent = String(n);
            baseArray = generateArray(n, pattern.value);
            liveArray = baseArray.slice();
            ops = [];
            opIndex = 0;
            compareCount = 0;
            writeCount = 0;
            activeA = -1;
            activeB = -1;
            activePivot = -1;
            done = false;
            comparisons.textContent = "0";
            writes.textContent = "0";
            status.textContent = "Data prepared: " + n + " elements. Press Run Sort to animate " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "sorting") + ".";
            draw();
        }

        function pushCompare(a, b) {
            ops.push({ t: "c", a: a, b: b });
        }
        function pushSwap(a, b) {
            ops.push({ t: "s", a: a, b: b });
        }
        function pushWrite(i, v) {
            ops.push({ t: "w", i: i, v: v });
        }
        function pushPivot(i) {
            ops.push({ t: "p", i: i });
        }

        function buildBubble(arr) {
            var a = arr.slice();
            var n = a.length;
            for (var i = 0; i < n - 1; i++) {
                for (var j = 0; j < n - i - 1; j++) {
                    pushCompare(j, j + 1);
                    if (a[j] > a[j + 1]) {
                        var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                        pushSwap(j, j + 1);
                    }
                }
            }
        }

        function buildSelection(arr) {
            var a = arr.slice();
            var n = a.length;
            for (var i = 0; i < n - 1; i++) {
                var min = i;
                for (var j = i + 1; j < n; j++) {
                    pushCompare(min, j);
                    if (a[j] < a[min]) min = j;
                }
                if (min !== i) {
                    var t = a[i]; a[i] = a[min]; a[min] = t;
                    pushSwap(i, min);
                }
            }
        }

        function buildInsertion(arr) {
            var a = arr.slice();
            for (var i = 1; i < a.length; i++) {
                var key = a[i];
                var j = i - 1;
                while (j >= 0) {
                    pushCompare(j, j + 1);
                    if (a[j] > key) {
                        a[j + 1] = a[j];
                        pushWrite(j + 1, a[j]);
                        j--;
                    } else {
                        break;
                    }
                }
                a[j + 1] = key;
                pushWrite(j + 1, key);
            }
        }

        function buildMerge(arr) {
            var a = arr.slice();
            function rec(l, r) {
                if (l >= r) return;
                var m = Math.floor((l + r) / 2);
                rec(l, m);
                rec(m + 1, r);
                var left = a.slice(l, m + 1);
                var right = a.slice(m + 1, r + 1);
                var i = 0;
                var j = 0;
                var k = l;
                while (i < left.length && j < right.length) {
                    pushCompare(l + i, m + 1 + j);
                    if (left[i] <= right[j]) {
                        a[k] = left[i];
                        pushWrite(k, left[i]);
                        i++;
                    } else {
                        a[k] = right[j];
                        pushWrite(k, right[j]);
                        j++;
                    }
                    k++;
                }
                while (i < left.length) {
                    a[k] = left[i];
                    pushWrite(k, left[i]);
                    i++;
                    k++;
                }
                while (j < right.length) {
                    a[k] = right[j];
                    pushWrite(k, right[j]);
                    j++;
                    k++;
                }
            }
            rec(0, a.length - 1);
        }

        function buildQuick(arr) {
            var a = arr.slice();
            function rec(l, r) {
                if (l >= r) return;
                var pivot = a[r];
                pushPivot(r);
                var i = l;
                for (var j = l; j < r; j++) {
                    pushCompare(j, r);
                    if (a[j] <= pivot) {
                        if (i !== j) {
                            var t = a[i]; a[i] = a[j]; a[j] = t;
                            pushSwap(i, j);
                        }
                        i++;
                    }
                }
                if (i !== r) {
                    var tt = a[i]; a[i] = a[r]; a[r] = tt;
                    pushSwap(i, r);
                }
                rec(l, i - 1);
                rec(i + 1, r);
            }
            rec(0, a.length - 1);
        }

        function buildHeap(arr) {
            var a = arr.slice();
            var n = a.length;

            function heapify(sizeN, i) {
                var largest = i;
                var left = 2 * i + 1;
                var right = 2 * i + 2;
                if (left < sizeN) {
                    pushCompare(left, largest);
                    if (a[left] > a[largest]) largest = left;
                }
                if (right < sizeN) {
                    pushCompare(right, largest);
                    if (a[right] > a[largest]) largest = right;
                }
                if (largest !== i) {
                    var t = a[i]; a[i] = a[largest]; a[largest] = t;
                    pushSwap(i, largest);
                    heapify(sizeN, largest);
                }
            }

            for (var i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
            for (var end = n - 1; end > 0; end--) {
                var tmp = a[0]; a[0] = a[end]; a[end] = tmp;
                pushSwap(0, end);
                heapify(end, 0);
            }
        }

        function buildCounting(arr) {
            var a = arr.slice();
            var n = a.length;
            if (!n) return;
            var minV = a[0];
            var maxV = a[0];
            for (var i = 1; i < n; i++) {
                if (a[i] < minV) minV = a[i];
                if (a[i] > maxV) maxV = a[i];
            }
            var range = maxV - minV + 1;
            var count = new Array(range);
            for (var z = 0; z < range; z++) count[z] = 0;
            for (i = 0; i < n; i++) count[a[i] - minV] += 1;
            for (i = 1; i < range; i++) count[i] += count[i - 1];
            var out = new Array(n);
            for (i = n - 1; i >= 0; i--) {
                var key = a[i] - minV;
                var pos = count[key] - 1;
                out[pos] = a[i];
                count[key] -= 1;
            }
            for (i = 0; i < n; i++) {
                pushWrite(i, out[i]);
            }
        }

        function buildRadix(arr) {
            var a = arr.slice();
            var n = a.length;
            if (!n) return;
            var maxV = a[0];
            for (var i = 1; i < n; i++) if (a[i] > maxV) maxV = a[i];

            for (var exp = 1; Math.floor(maxV / exp) > 0; exp *= 10) {
                var out = new Array(n);
                var count = [0,0,0,0,0,0,0,0,0,0];
                for (i = 0; i < n; i++) {
                    var d = Math.floor(a[i] / exp) % 10;
                    count[d] += 1;
                }
                for (i = 1; i < 10; i++) count[i] += count[i - 1];
                for (i = n - 1; i >= 0; i--) {
                    d = Math.floor(a[i] / exp) % 10;
                    var p = count[d] - 1;
                    out[p] = a[i];
                    count[d] -= 1;
                }
                for (i = 0; i < n; i++) {
                    a[i] = out[i];
                    pushWrite(i, out[i]);
                }
            }
        }

        function buildOps() {
            ops = [];
            var base = baseArray.slice();
            if (algo.value === "bubble") buildBubble(base);
            else if (algo.value === "selection") buildSelection(base);
            else if (algo.value === "merge") buildMerge(base);
            else if (algo.value === "quick") buildQuick(base);
            else if (algo.value === "heap") buildHeap(base);
            else if (algo.value === "counting") buildCounting(base);
            else if (algo.value === "radix") buildRadix(base);
            else buildInsertion(base);
            opIndex = 0;
        }

        function applyOp(op) {
            if (!op) return;
            if (op.t === "c") {
                compareCount++;
                activeA = op.a;
                activeB = op.b;
            } else if (op.t === "s") {
                writeCount += 2;
                activeA = op.a;
                activeB = op.b;
                var t = liveArray[op.a];
                liveArray[op.a] = liveArray[op.b];
                liveArray[op.b] = t;
            } else if (op.t === "w") {
                writeCount++;
                activeA = op.i;
                activeB = -1;
                liveArray[op.i] = op.v;
            } else if (op.t === "p") {
                activePivot = op.i;
            }
        }

        function draw() {
            var w = canvas.width;
            var h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            var grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(6, 24, 46, 0.95)");
            grad.addColorStop(1, "rgba(4, 12, 26, 0.98)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            var n = liveArray.length;
            if (!n) return;
            var maxV = 1;
            for (var i = 0; i < n; i++) if (liveArray[i] > maxV) maxV = liveArray[i];
            var gap = n > 70 ? 1 : 1.8;
            var barW = Math.max(1, (w - (n + 1) * gap) / n);

            for (var x = 0; x < n; x++) {
                var ratio = liveArray[x] / maxV;
                var bh = clamp(ratio * (h - 28), 2, h - 24);
                var bx = gap + x * (barW + gap);
                var by = h - bh - 8;

                var color = "rgba(125, 211, 252, 0.9)";
                if (done) color = "rgba(74, 222, 128, 0.9)";
                if (x === activePivot) color = "rgba(251, 146, 60, 0.95)";
                if (x === activeA || x === activeB) color = "rgba(248, 113, 113, 0.95)";

                ctx.fillStyle = color;
                ctx.fillRect(bx, by, barW, bh);
            }

            comparisons.textContent = String(compareCount);
            writes.textContent = String(writeCount);
        }

        function stepLoop() {
            if (!running) return;
            var steps = parseInt(speed.value, 10) || 42;
            speedValue.textContent = String(steps);
            for (var s = 0; s < steps && opIndex < ops.length; s++) {
                applyOp(ops[opIndex]);
                opIndex++;
            }
            draw();
            if (opIndex >= ops.length) {
                running = false;
                done = true;
                activeA = -1;
                activeB = -1;
                activePivot = -1;
                draw();
                status.textContent = "Completed: " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "Sort") + " sorted " + liveArray.length + " elements with " + compareCount + " comparisons and " + writeCount + " writes.";
                runBtn.textContent = "Run Again";
                return;
            }
            rafId = window.requestAnimationFrame(stepLoop);
        }

        function cancelRun() {
            running = false;
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function startRun() {
            cancelRun();
            liveArray = baseArray.slice();
            compareCount = 0;
            writeCount = 0;
            activeA = -1;
            activeB = -1;
            activePivot = -1;
            done = false;
            buildOps();
            runBtn.textContent = "Running...";
            running = true;
            status.textContent = "Sorting in progress: " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "Algorithm") + " on " + liveArray.length + " items.";
            stepLoop();
        }

        var autoRunTimer = null;
        function queueAutoRun(delayMs) {
            if (autoRunTimer) window.clearTimeout(autoRunTimer);
            autoRunTimer = window.setTimeout(function() {
                startRun();
            }, typeof delayMs === "number" ? delayMs : 110);
        }

        runBtn.addEventListener("click", startRun);
        shuffleBtn.addEventListener("click", function() {
            cancelRun();
            resetDataset();
            runBtn.textContent = "Run Sort";
        });
        algo.addEventListener("change", function() {
            cancelRun();
            setMeta();
            resetDataset();
            queueAutoRun(70);
        });
        pattern.addEventListener("change", function() {
            cancelRun();
            resetDataset();
            queueAutoRun(70);
        });
        size.addEventListener("input", function() {
            cancelRun();
            sizeValue.textContent = size.value;
            resetDataset();
            queueAutoRun(120);
        });
        speed.addEventListener("input", function() {
            speedValue.textContent = speed.value;
            if (!running) queueAutoRun(40);
        });

        window.addEventListener("beforeunload", cancelRun);

        setMeta();
        speedValue.textContent = speed.value;
        resetDataset();
        queueAutoRun(120);
    }


    window.setupSegmentationDemo = setupSegmentationDemo;
    window.setupExplainabilityDemo = setupExplainabilityDemo;
    window.setupSyntheticBoosterDemo = setupSyntheticBoosterDemo;
    window.setupClassicMlDemo = setupClassicMlDemo;
    window.setupEdgeBenchmarkDemo = setupEdgeBenchmarkDemo;
})();

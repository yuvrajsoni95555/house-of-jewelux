import os

html_snippet = '''          <!-- Bespoke Studio Card matching Reference Image 2 -->
          <div class="bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden max-w-7xl mx-auto">
            
            <!-- Card Header: Hamburger | "RING" + Subtitle | Cart Bag -->
            <div class="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-white">
              <button type="button" onclick="toggleMobileNav()" class="p-2 -ml-2 text-neutral-800 hover:text-black focus:outline-none transition" aria-label="Menu">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>

              <div class="text-center">
                <h2 class="text-xs uppercase tracking-[0.3em] font-semibold text-neutral-900">RING</h2>
                <p class="font-serif italic text-xs text-[#8A6B38] -mt-0.5">where elegance becomes eternal</p>
              </div>

              <button type="button" onclick="openCartDrawer()" class="relative p-2 -mr-2 text-neutral-800 hover:text-black focus:outline-none transition" aria-label="Cart">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <span id="bespoke-cart-badge" class="header-cart-badge absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
              </button>
            </div>

            <!-- Card Body: Two-Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-12 min-h-[640px] items-stretch">
              
              <!-- Left: 3D Ring Viewer (Large, Upright, White Canvas, Realistic Contact Shadow) -->
              <div class="lg:col-span-6 xl:col-span-7 relative bg-white flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-200/70 p-4 sm:p-8">
                
                <!-- Floating Action Controls (Minimalist, unobtrusive) -->
                <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <button onclick="resetBespokeCamera()" class="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-600 hover:text-black transition" title="Reset Camera View">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                  <button onclick="toggleBespokeFullscreen()" class="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-600 hover:text-black transition" title="Fullscreen View">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                  </button>
                  <button onclick="shareBespokeConfig()" class="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-600 hover:text-black transition" title="Share Ring Configuration">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                  </button>
                  <button onclick="zoomBespokeIn()" class="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-600 hover:text-black transition" title="Zoom In">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                  <button onclick="zoomBespokeOut()" class="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-600 hover:text-black transition" title="Zoom Out">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M20 12H4"/>
                    </svg>
                  </button>
                </div>

                <!-- 3D Canvas Viewport -->
                <div class="w-full h-full flex items-center justify-center relative min-h-[420px] sm:min-h-[520px]">
                  <div id="bespoke-ring-visualizer" class="w-full h-full flex items-center justify-center">
                    <div class="canvas-3d-wrapper !bg-white !rounded-none !border-none !shadow-none !p-0 w-full h-full flex items-center justify-center" id="bespoke-3d-wrapper">
                      <canvas id="bespoke-3d-canvas" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>
                      
                      <!-- Loading overlay -->
                      <div class="bespoke-loader" id="bespoke-loader" aria-hidden="true">
                        <div class="loader-spinner"></div>
                        <div class="loader-text">Loading 3D Atelier...</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Brand watermark in bottom right -->
                <div class="absolute bottom-4 right-4 pointer-events-none select-none">
                  <span class="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-light">house of jewelux</span>
                </div>
              </div>

              <!-- Right: Customization Controls Panel -->
              <div class="lg:col-span-6 xl:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
                
                <div class="space-y-6">
                  <!-- Title & Subtitle matching Reference Image -->
                  <div>
                    <h3 class="font-serif text-3xl sm:text-4xl text-neutral-900 font-normal tracking-tight">The Ring</h3>
                    <p class="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mt-1.5">
                      Masterpiece crafted by House of Jewelux that makes you shine on bright days as well as dark nights.
                    </p>
                  </div>

                  <!-- Tabs: RING OPTIONS | ENGRAVING -->
                  <div class="flex items-center gap-8 border-b border-neutral-200">
                    <button type="button" id="tab-btn-options" onclick="switchBespokeTab('options')" class="text-xs uppercase tracking-widest font-bold text-black border-b-2 border-black pb-3 -mb-[2px] transition focus:outline-none">
                      RING OPTIONS
                    </button>
                    <button type="button" id="tab-btn-engraving" onclick="switchBespokeTab('engraving')" class="text-xs uppercase tracking-widest font-medium text-neutral-400 hover:text-black border-b-2 border-transparent pb-3 -mb-[2px] transition focus:outline-none">
                      ENGRAVING
                    </button>
                  </div>

                  <!-- TAB 1: RING OPTIONS -->
                  <div id="customizer-panel-options" class="space-y-6">
                    
                    <!-- 1. BAND STYLE -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">BAND STYLE</span>
                      </div>
                      <div class="flex items-center gap-6">
                        <!-- Traditional Style Button -->
                        <button type="button" onclick="setBespokeBandStyle('traditional')" data-bespoke-style="traditional" class="band-style-item group flex flex-col items-center focus:outline-none">
                          <div class="band-style-circle">
                            <!-- Clean minimal ring silhouette -->
                            <svg class="w-6 h-6 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="7.5" stroke-width="2.2"/>
                              <path d="M12 4.5V2" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                          </div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Traditional</span>
                        </button>

                        <!-- Cathedral Style Button (Default active) -->
                        <button type="button" onclick="setBespokeBandStyle('cathedral')" data-bespoke-style="cathedral" class="band-style-item active group flex flex-col items-center focus:outline-none">
                          <div class="band-style-circle">
                            <!-- Cathedral arch ring silhouette -->
                            <svg class="w-6 h-6 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="13" r="6.8" stroke-width="2.2"/>
                              <path d="M7 9C8.5 6.5 10 5.5 12 5.5C14 5.5 15.5 6.5 17 9" stroke-width="2" stroke-linecap="round"/>
                              <polygon points="12,2 14,5 10,5" fill="currentColor"/>
                            </svg>
                          </div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Cathedral</span>
                        </button>
                      </div>
                    </div>

                    <!-- 2. BAND METAL -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">BAND METAL</span>
                        <span id="selected-metal-name" class="text-xs text-neutral-500 font-normal">Yellow Gold</span>
                      </div>
                      <div class="flex items-center gap-6">
                        <!-- Yellow Gold Swatch -->
                        <button type="button" onclick="setBespokeMetal('yellow-gold')" data-bespoke-metal="yellow-gold" class="metal-swatch-item active group flex flex-col items-center focus:outline-none" title="18K Yellow Gold">
                          <div class="metal-swatch-circle" style="background: radial-gradient(circle at 35% 30%, #FFEBA3 0%, #D4A237 55%, #8F6614 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Yellow Gold</span>
                        </button>

                        <!-- White Gold Swatch -->
                        <button type="button" onclick="setBespokeMetal('white-gold')" data-bespoke-metal="white-gold" class="metal-swatch-item group flex flex-col items-center focus:outline-none" title="Liquid White Gold / Rhodium">
                          <div class="metal-swatch-circle" style="background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E2E6EC 55%, #9AA4B2 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">White Gold</span>
                        </button>

                        <!-- Rose Gold Swatch -->
                        <button type="button" onclick="setBespokeMetal('rose-gold')" data-bespoke-metal="rose-gold" class="metal-swatch-item group flex flex-col items-center focus:outline-none" title="18K Rose Gold">
                          <div class="metal-swatch-circle" style="background: radial-gradient(circle at 35% 30%, #FFD6CB 0%, #CF7A64 55%, #8C3E2D 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Rose Gold</span>
                        </button>
                      </div>
                    </div>

                    <!-- 3. STONE (Vivid color swatches matching Image 2 & user's emphasis 'colour') -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">STONE</span>
                        <span id="selected-gem-name" class="text-xs text-neutral-500 font-normal">Diamond</span>
                      </div>
                      <div class="flex items-center gap-6">
                        <!-- Diamond Swatch -->
                        <button type="button" onclick="setBespokeGem('diamond')" data-bespoke-gem="diamond" class="gem-swatch-item active group flex flex-col items-center focus:outline-none" title="Sparkling White Diamond">
                          <div class="gem-swatch-circle" style="background: radial-gradient(circle at 30% 30%, #FFFFFF 0%, #E8EEF5 45%, #B8C8D8 100%);">
                            <span class="text-[11px] text-neutral-600">✦</span>
                          </div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Diamond</span>
                        </button>

                        <!-- Ruby Swatch (Vibrant pigeon blood red) -->
                        <button type="button" onclick="setBespokeGem('ruby')" data-bespoke-gem="ruby" class="gem-swatch-item group flex flex-col items-center focus:outline-none" title="Pigeon Blood Ruby">
                          <div class="gem-swatch-circle" style="background: radial-gradient(circle at 30% 30%, #FF5A78 0%, #9E1224 55%, #4A030C 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Ruby</span>
                        </button>

                        <!-- Emerald Swatch (Vivid Colombian green) -->
                        <button type="button" onclick="setBespokeGem('emerald')" data-bespoke-gem="emerald" class="gem-swatch-item group flex flex-col items-center focus:outline-none" title="Colombian Emerald">
                          <div class="gem-swatch-circle" style="background: radial-gradient(circle at 30% 30%, #34D399 0%, #0A7A50 55%, #023820 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Emerald</span>
                        </button>

                        <!-- Sapphire Swatch (Deep royal Kashmir blue) -->
                        <button type="button" onclick="setBespokeGem('sapphire')" data-bespoke-gem="sapphire" class="gem-swatch-item group flex flex-col items-center focus:outline-none" title="Royal Kashmir Sapphire">
                          <div class="gem-swatch-circle" style="background: radial-gradient(circle at 30% 30%, #60A5FA 0%, #123680 55%, #05163D 100%);"></div>
                          <span class="text-[11px] text-neutral-800 mt-2 font-medium">Sapphire</span>
                        </button>
                      </div>
                    </div>

                    <!-- 4. STONE CUT -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">STONE CUT</span>
                        <span id="selected-cut-name" class="text-xs text-neutral-500 font-normal">Round Brilliant</span>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <button type="button" onclick="setBespokeCut('round')" data-bespoke-cut="round" class="pill-cut-btn active py-1.5 px-3 sm:px-3.5 rounded-full border border-black bg-black text-white text-xs font-medium transition shadow-sm">Round</button>
                        <button type="button" onclick="setBespokeCut('princess')" data-bespoke-cut="princess" class="pill-cut-btn py-1.5 px-3 sm:px-3.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition">Princess</button>
                        <button type="button" onclick="setBespokeCut('oval')" data-bespoke-cut="oval" class="pill-cut-btn py-1.5 px-3 sm:px-3.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition">Oval</button>
                        <button type="button" onclick="setBespokeCut('emerald-cut')" data-bespoke-cut="emerald-cut" class="pill-cut-btn py-1.5 px-3 sm:px-3.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition">Emerald</button>
                        <button type="button" onclick="setBespokeCut('cushion')" data-bespoke-cut="cushion" class="pill-cut-btn py-1.5 px-3 sm:px-3.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition">Cushion</button>
                        <button type="button" onclick="setBespokeCut('pear')" data-bespoke-cut="pear" class="pill-cut-btn py-1.5 px-3 sm:px-3.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition">Pear</button>
                      </div>
                    </div>

                    <!-- 5. CARAT WEIGHT -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">CARAT WEIGHT</span>
                        <span id="bespoke-carat-display" class="text-xs text-neutral-500 font-normal">2.50 ct</span>
                      </div>
                      <div class="grid grid-cols-4 gap-2.5">
                        <button type="button" onclick="setBespokeCarat(1.00)" data-bespoke-carat="1.0" class="pill-carat-btn py-2 px-3 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition text-center">1.00 ct</button>
                        <button type="button" onclick="setBespokeCarat(1.75)" data-bespoke-carat="1.75" class="pill-carat-btn py-2 px-3 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition text-center">1.75 ct</button>
                        <button type="button" onclick="setBespokeCarat(2.50)" data-bespoke-carat="2.5" class="pill-carat-btn active py-2 px-3 rounded-full border border-black bg-black text-white text-xs font-medium transition shadow-sm text-center">2.50 ct</button>
                        <button type="button" onclick="setBespokeCarat(4.00)" data-bespoke-carat="4.0" class="pill-carat-btn py-2 px-3 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-normal transition text-center">4.00 ct</button>
                      </div>
                    </div>

                    <!-- 6. RING SIZE -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">RING SIZE</span>
                        <button type="button" onclick="openRingSizeGuide()" class="text-xs text-[#8A6B38] underline hover:text-black transition">Ring Size Guide</button>
                      </div>
                      <select id="bespoke-ring-size-select" onchange="setBespokeRingSize(this.value)" class="w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2.5 text-xs text-neutral-800 focus:outline-none focus:border-black transition">
                        <option value="6">Indian Size 6 — 14.5 mm</option>
                        <option value="8">Indian Size 8 — 15.2 mm</option>
                        <option value="10">Indian Size 10 — 15.8 mm</option>
                        <option value="12">Indian Size 12 — 16.5 mm (Standard Women)</option>
                        <option value="14" selected>Indian Size 14 — 17.2 mm</option>
                        <option value="16">Indian Size 16 — 17.8 mm</option>
                        <option value="18">Indian Size 18 — 18.5 mm (Standard Men)</option>
                        <option value="20">Indian Size 20 — 19.1 mm</option>
                        <option value="22">Indian Size 22 — 19.8 mm</option>
                        <option value="24">Indian Size 24 — 20.4 mm</option>
                      </select>
                    </div>

                  </div>

                  <!-- TAB 2: ENGRAVING -->
                  <div id="customizer-panel-engraving" class="hidden space-y-6">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900">INSIDE-BAND ENGRAVING</span>
                        <span id="engraving-char-count" class="text-xs text-neutral-400 font-mono">0 / 20</span>
                      </div>
                      <p class="text-xs text-neutral-500 font-light mb-3">
                        Laser engraved inside the shank by our master artisans. Included complimentary with every bespoke order.
                      </p>
                      <input 
                        type="text" 
                        id="bespoke-engraving-input" 
                        maxlength="20" 
                        placeholder="e.g. FOREVER • 2026"
                        oninput="handleEngravingInput(this.value)"
                        class="w-full bg-white border border-neutral-300 focus:border-black rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none transition tracking-widest uppercase font-medium"
                      />
                    </div>

                    <!-- Live Engraving Ribbon Preview -->
                    <div>
                      <span class="text-[10px] uppercase tracking-wider text-neutral-400 block mb-2 font-medium">SHANK INTERIOR PREVIEW:</span>
                      <div class="engraving-ribbon-preview flex items-center justify-center p-4 rounded-xl border border-neutral-200 bg-neutral-100">
                        <span id="engraving-preview-text" class="font-serif italic text-base text-neutral-700 tracking-widest select-none">
                          JEWELUX • 2026
                        </span>
                      </div>
                    </div>

                    <!-- Font Style -->
                    <div>
                      <span class="text-[11px] uppercase tracking-wider font-bold text-neutral-900 block mb-2">TYPOGRAPHY SCRIPT</span>
                      <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="setBespokeEngravingFont('serif')" data-engrave-font="serif" class="py-2 px-3 rounded-lg border border-black bg-black text-white text-xs font-serif transition text-center shadow-sm">Serif</button>
                        <button type="button" onclick="setBespokeEngravingFont('script')" data-engrave-font="script" class="py-2 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs italic font-serif transition text-center">Script</button>
                        <button type="button" onclick="setBespokeEngravingFont('sans')" data-engrave-font="sans" class="py-2 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-black text-xs font-sans uppercase tracking-wider transition text-center">Modern</button>
                      </div>
                    </div>

                    <!-- Symbols Palette -->
                    <div class="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
                      <span class="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Symbols:</span>
                      <div class="flex items-center gap-1.5">
                        <button type="button" onclick="insertEngravingSymbol('•')" class="w-7 h-7 rounded bg-white border border-neutral-200 hover:border-black text-xs font-medium transition" title="Bullet dot">•</button>
                        <button type="button" onclick="insertEngravingSymbol('♡')" class="w-7 h-7 rounded bg-white border border-neutral-200 hover:border-black text-xs font-medium transition" title="Heart">♡</button>
                        <button type="button" onclick="insertEngravingSymbol('✦')" class="w-7 h-7 rounded bg-white border border-neutral-200 hover:border-black text-xs font-medium transition" title="Star emblem">✦</button>
                        <button type="button" onclick="insertEngravingSymbol('∞')" class="w-7 h-7 rounded bg-white border border-neutral-200 hover:border-black text-xs font-medium transition" title="Infinity">∞</button>
                      </div>
                      <button type="button" onclick="clearBespokeEngraving()" class="text-[10px] text-neutral-500 hover:text-black uppercase tracking-wider font-semibold">
                        Clear
                      </button>
                    </div>

                  </div>

                </div>

                <!-- Bottom Pricing & Add To Cart Bar -->
                <div class="pt-6 mt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div class="text-left w-full sm:w-auto">
                    <span class="text-[10px] uppercase tracking-wider text-neutral-400 block font-medium">ESTIMATED PRICE</span>
                    <span id="bespoke-calc-price" class="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight">₹1,25,000</span>
                  </div>

                  <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button onclick="orderBespokePiece()" class="flex-1 sm:flex-initial bg-black hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg shadow-md hover:shadow-lg transition text-center" title="Add Bespoke Ring to Cart">
                      ADD TO CART
                    </button>
                    <button onclick="consultBespokePiece()" class="border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs uppercase tracking-wider px-4 py-3.5 rounded-lg transition" title="Direct WhatsApp Goldsmith Consultation">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>'''

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start bg-white p-6 sm:p-10 rounded-2xl border border-[#C5A674]/30 shadow-lg">'
end_marker = '<!-- 6. Luxury Storytelling Tri-Column ("CRAFTED WITH INTENTION") -->'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Error: start_marker not found")
    exit(1)

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Error: end_marker not found")
    exit(1)

# Find the closing </section> right before end_marker
section_close_idx = content.rfind('</section>', start_idx, end_idx)
if section_close_idx == -1:
    print("Error: section_close_idx not found")
    exit(1)

# Find the closing </div> of container before section_close_idx
container_close_idx = content.rfind('</div>', start_idx, section_close_idx)
if container_close_idx == -1:
    print("Error: container_close_idx not found")
    exit(1)

# The content between start_idx and the container_close_idx + 6 is what we replace
# Specifically, the inner bespoke card ends before container_close_idx
# Let's inspect what precedes container_close_idx:
preceding = content[container_close_idx - 60:container_close_idx + 6]
print("Found container close marker:\n", repr(preceding))

# In index.html, right after the bespoke card was:
# </div>\n\n</div>\n\n</section>
# The bespoke card starts at start_idx and its closing tag is the last </div> before the outer container's </div>

# Let's find the closing tag of the bespoke card precisely
# The bespoke card was:
# <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start bg-white p-6 sm:p-10 rounded-2xl border border-[#C5A674]/30 shadow-lg">
# ...
#               <!-- Atelier Actions & Preserved Consult Button -->
#               <div class="pt-5 border-t border-[#E8E3D8] flex items-center justify-between gap-4">
# ...
#                 <button onclick="consultBespokePiece()" ...>
#                   Consult
#                 </button>
#               </div>
#             </div>
#           </div>

card_end_marker = '</div>\n\n            </div>\n\n          </div>'
card_end_idx = content.find(card_end_marker, start_idx)
if card_end_idx == -1:
    # Try alternate whitespace
    import re
    m = re.search(r'consultBespokePiece[\s\S]*?<\/div>\s*<\/div>\s*<\/div>', content[start_idx:section_close_idx])
    if m:
        card_end_idx = start_idx + m.end()
        print("Regex matched card end at", card_end_idx)
    else:
        print("Error: card_end_marker not found")
        exit(1)
else:
    card_end_idx += len(card_end_marker)

print("Replacing from", start_idx, "to", card_end_idx)
new_content = content[:start_idx] + html_snippet + content[card_end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated index.html with reference Image 2 Bespoke Studio layout!")

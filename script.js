const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbysBtKkUjwA1UutGKZPxL0DFR1nNJpV0tflXeV8EQFNmfOu5yM9pOuoIMVzI1sVL8lU/exec";
        
        // CONFIGURACIÓN DE ACCESO
        const WOD_ACCESS_KEY = "NEXUS2026"; 
        let isUnlocked = localStorage.getItem('nexus_wod_unlocked') === 'true';
        let planificaciones = {}; 
        let currentSelectedDate = "";

        function getTodayString() {
            const hoy = new Date();
            const offset = hoy.getTimezoneOffset();
            const localHoy = new Date(hoy.getTime() - (offset * 60 * 1000));
            return localHoy.toISOString().split('T')[0];
        }

        async function cargarDatosDesdeSheet() {
            try {
                const response = await fetch(SHEET_API_URL);
                const data = await response.json();
                
                data.planificaciones.forEach(item => {
                    planificaciones[item.fecha] = item;
                });

                const carouselInner = document.querySelector('#nexusCarousel .carousel-inner');
                const carouselIndicators = document.querySelector('#nexusCarousel .carousel-indicators');
                
                if (data.fotos && data.fotos.length > 0) {
                    carouselInner.innerHTML = ""; 
                    carouselIndicators.innerHTML = "";
                    data.fotos.forEach((url, index) => {
                        const isActive = index === 0 ? 'active' : '';
                        carouselInner.innerHTML += `
                            <div class="carousel-item ${isActive}" data-bs-interval="3000">
                                <img src="${url}" class="d-block w-100 nexus-carousel-img" alt="Atleta Nexus">
                            </div>`;
                        carouselIndicators.innerHTML += `
                            <button type="button" data-bs-target="#nexusCarousel" data-bs-slide-to="${index}" class="${isActive}"></button>`;
                    });
                }
                
                currentSelectedDate = getTodayString();
                renderWOD(currentSelectedDate);

            } catch (error) {
                console.error("Error cargando Nexus Data:", error);
                document.getElementById('wod-content').innerHTML = `<p class="text-danger text-center">Error de conexión con la base de datos.</p>`;
            }
        }

        function unlockSection() {
            const input = document.getElementById('passInput');
            if (input.value.toUpperCase() === WOD_ACCESS_KEY.toUpperCase()) {
                isUnlocked = true;
                localStorage.setItem('nexus_wod_unlocked', 'true');
                renderWOD(currentSelectedDate);
            } else {
                input.classList.add('is-invalid');
                input.value = "";
                input.placeholder = "Clave incorrecta";
                setTimeout(() => {
                    input.classList.remove('is-invalid');
                    input.placeholder = "Ingrese contraseña";
                }, 2000);
            }
        }

        function renderWOD(dateStr) {
            currentSelectedDate = dateStr;
            const wod = planificaciones[dateStr];
            const wodContent = document.getElementById('wod-content');
            const dateTitle = document.getElementById('current-date-title');

            dateTitle.innerText = (dateStr === getTodayString()) ? "WOD de Hoy" : `Día: ${dateStr}`;

            // Si NO está desbloqueado, mostramos el prompt de contraseña
            if (!isUnlocked) {
                wodContent.innerHTML = `
                    <div class="text-center py-5 lock-container">
                        <i class="bi bi-lock-fill text-primary mb-3" style="font-size: 3rem;"></i>
                        <h5 class="text-uppercase mb-4" style="font-family: 'Orbitron';">Acceso Restringido</h5>
                        <p class="small text-secondary mb-4">Esta planificación es exclusiva para atletas nexus.</p>
                        <div class="nexus-input-group mb-3">
                            <input type="password" id="passInput" placeholder="Ingrese contraseña" onkeypress="if(event.key === 'Enter') unlockSection()">
                        </div>
                        <button onclick="unlockSection()" class="btn btn-nexus w-100">Desbloquear</button>
                    </div>
                `;
                return;
            }

            // Si está desbloqueado, mostramos el contenido normal
            if (wod) {
                wodContent.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start border-bottom pb-2 mb-4">
                        <h3 class="text-white mb-0">${wod.titulo}</h3>
                        <button onclick="isUnlocked=false; localStorage.removeItem('nexus_wod_unlocked'); renderWOD(currentSelectedDate);" class="btn btn-sm btn-outline-secondary border-0"><i class="bi bi-box-arrow-right"></i></button>
                    </div>
                    <div class="mb-4">
                        <h5 class="text-info fw-bold">A. CALENTAMIENTO</h5>
                        <p class="text-light">${wod.warmup}</p>
                    </div>
                    <div class="mb-4">
                        <h5 class="text-info fw-bold">B. FUERZA / SKILL</h5>
                        <p class="text-light">${wod.strength}</p>
                    </div>
                    <div class="metcon-box p-3 rounded">
                        <h5 class="text-primary fw-bold text-uppercase">C. METCON</h5>
                        <p class="mb-0 text-white lead">${wod.metcon}</p>
                    </div>
                `;
            } else {
                wodContent.innerHTML = `
                    <div class="text-center py-5">
                        <p class="italic text-secondary">Sin planificación para el ${dateStr}.</p>
                        <button onclick="document.getElementById('datePicker').value = '${getTodayString()}'; renderWOD('${getTodayString()}');" class="btn btn-nexus btn-sm">Volver a hoy</button>
                    </div>
                `;
            }
        }

        document.getElementById('datePicker').addEventListener('change', (e) => {
            renderWOD(e.target.value);
        });

        cargarDatosDesdeSheet();
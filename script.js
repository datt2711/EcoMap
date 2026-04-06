// script.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Page Transition (Fade in on load)
    document.body.classList.add('loaded');

    // 2. Active Navigation Link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) link.classList.add('active');
    });

    // 3. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.12
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });

    // 3b. Navbar: hide on scroll down, reveal on scroll up
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const current = window.scrollY;
                    if (current > lastScroll && current > 100) {
                        navbar.style.transform = 'translateY(-100%)';
                    } else {
                        navbar.style.transform = 'translateY(0)';
                    }
                    lastScroll = current;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // 3c. Subtle 3D card tilt on mouse move
    document.querySelectorAll('.card').forEach(card => {
        // Skip float-idle cards on mobile
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const tiltX = dy * -5;  // degrees
            const tiltY = dx * 5;
            card.style.transform = `translateY(-10px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`;
            card.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.65s cubic-bezier(0.16,1,0.3,1), box-shadow 0.65s cubic-bezier(0.16,1,0.3,1)';
        });
    });

    // 3d. Soft glow cursor follower (home theme only)
    if (document.body.classList.contains('home-theme')) {
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: fixed; pointer-events: none; z-index: 9999;
            width: 380px; height: 380px; border-radius: 50%;
            background: radial-gradient(circle, rgba(47,168,75,0.12) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            transition: left 0.6s cubic-bezier(0.16,1,0.3,1), top 0.6s cubic-bezier(0.16,1,0.3,1);
            will-change: left, top;
        `;
        document.body.appendChild(glow);
        document.addEventListener('mousemove', e => {
            glow.style.left = e.clientX + 'px';
            glow.style.top  = e.clientY + 'px';
        });
    }

    // 4. Map Logic
    const mapEl = document.getElementById('map');
    if (mapEl && typeof L !== 'undefined') {
        const map = L.map('map').setView([-33.8688, 151.2093], 11);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 19
        }).addTo(map);

        fetch('locations.json')
            .then(res => res.json())
            .then(facilities => {
                const markers = [];
                const getColor = (type) => ({ 
                    community_recycling_centre: '#0A84FF', 
                    material_recovery_facility: '#FF9F0A', 
                    resource_recovery: '#FF9F0A',
                    industrial_recycling_park: '#FF9F0A',
                    return_and_earn: '#34A853',
                    scrap_metal: '#8E8E93',
                    green_waste: '#32D74B'
                }[type] || '#1d1d1f');

                facilities.forEach(fac => {
                    const marker = L.circleMarker([fac.lat, fac.lng], {
                        radius: 8,
                        fillColor: getColor(fac.category),
                        color: "#ffffff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map);

                    marker.bindPopup(`
                        <div style="font-family: 'Inter', sans-serif;">
                            <h4 style="margin-bottom: 5px;">${fac.name}</h4>
                            <span style="font-size: 0.85rem; color: #6e6e73; text-transform: capitalize;">${fac.category.replace(/_/g, ' ')}</span>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
                            <p style="margin: 0; font-size: 0.9rem;"><strong>Address:</strong> ${fac.address}</p>
                            <p style="margin: 8px 0; font-size: 0.9rem;"><strong>Accepts:</strong> ${fac.materials.join(', ')}</p>
                            <small><b>Hours:</b> ${fac.hours}</small>
                        </div>
                    `);
                    markers.push({ facility: fac, marker: marker });
                });

                // Filter functionality
                const filters = document.querySelectorAll('.filter-btn');
                filters.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filters.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        const type = btn.getAttribute('data-type');
                        markers.forEach(item => {
                            const isRecovery = ['material_recovery_facility', 'resource_recovery', 'industrial_recycling_park'].includes(item.facility.category);

                            if (type === 'all' || item.facility.category === type || (type === 'recovery' && isRecovery)) {
                                if (!map.hasLayer(item.marker)) map.addLayer(item.marker);
                            } else {
                                if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
                            }
                        });
                    });
                });
            })
            .catch(err => console.error("Map locations failed to load", err));
    }

    // 5. Chart Logic
    const recCtx = document.getElementById('recoveryChart');
    if (recCtx && typeof Chart !== 'undefined') {
        new Chart(recCtx, {
            type: 'bar',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023'],
                datasets: [
                    {
                        label: 'Generated (Mt)',
                        data: [74, 75, 76, 75.8, 76.5],
                        backgroundColor: '#1d1d1f',
                        borderRadius: 4
                    },
                    {
                        label: 'Recovered (Mt)',
                        data: [43, 44, 46, 46.5, 47],
                        backgroundColor: '#2fa84b',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const breakCtx = document.getElementById('breakdownChart');
    if (breakCtx && typeof Chart !== 'undefined') {
        new Chart(breakCtx, {
            type: 'doughnut',
            data: {
                labels: ['Organics', 'Paper & Card', 'Plastics', 'Glass', 'Metals', 'Other'],
                datasets: [{
                    data: [42, 25, 12, 8, 5, 8],
                    backgroundColor: [
                        '#A0522D',
                        '#0A84FF',
                        '#2fa84b',
                        '#64d2ff',
                        '#86868b',
                        '#1d1d1f'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }

    const emCtx = document.getElementById('emissionsChart');
    if (emCtx && typeof Chart !== 'undefined') {
        new Chart(emCtx, {
            type: 'bar',
            data: {
                labels: ['Paper', 'Aluminum', 'Glass', 'Plastics'],
                datasets: [{
                    label: '% Energy Saved (vs Raw Material)',
                    data: [60, 95, 30, 80],
                    backgroundColor: '#0A84FF',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => ctx.raw + '% Energy Saved' } }
                },
                scales: {
                    x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }


    // 6. Feedback Logic
    const feedbackForm = document.getElementById('feedbackForm');
    const successMsg = document.getElementById('successMessage');
    const statsSummary = document.getElementById('statsSummary');
    const statsContent = document.getElementById('statsContent');

    if (feedbackForm) {
        // Load initial stats
        let feedbackData = JSON.parse(localStorage.getItem('ecoMapFeedback')) || { easy: 0, moderate: 0, difficult: 0, total: 0 };

        const renderStats = () => {
            if (feedbackData.total > 0) {
                statsSummary.style.display = 'block';
                setTimeout(() => statsSummary.style.opacity = '1', 50);
                
                const ePct = Math.round((feedbackData.easy / feedbackData.total) * 100) || 0;
                const mPct = Math.round((feedbackData.moderate / feedbackData.total) * 100) || 0;
                const dPct = Math.round((feedbackData.difficult / feedbackData.total) * 100) || 0;

                statsContent.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Easy</span><span>${ePct}%</span></div>
                        <div class="stat-bar" style="width: ${ePct}%; background: var(--primary-green);"></div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Moderate</span><span>${mPct}%</span></div>
                        <div class="stat-bar" style="width: ${mPct}%; background: #E5A00D;"></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Difficult</span><span>${dPct}%</span></div>
                        <div class="stat-bar" style="width: ${dPct}%; background: #D9381E;"></div>
                    </div>
                `;
            }
        };

        renderStats();

        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get Ease
            const easeNode = document.querySelector('input[name="ease"]:checked');
            if (easeNode) {
                const easeVal = easeNode.value;
                feedbackData[easeVal]++;
                feedbackData.total++;
                localStorage.setItem('ecoMapFeedback', JSON.stringify(feedbackData));
            }

            // Animate transition to success
            feedbackForm.style.opacity = '0';
            setTimeout(() => {
                feedbackForm.style.display = 'none';
                successMsg.style.display = 'block';
                successMsg.style.opacity = '0';
                
                renderStats();
                
                setTimeout(() => {
                    successMsg.style.transition = 'opacity 0.5s ease';
                    successMsg.style.opacity = '1';
                }, 50);
                
                // Reset form after 4 seconds
                setTimeout(() => {
                    successMsg.style.opacity = '0';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                        feedbackForm.reset();
                        feedbackForm.style.display = 'block';
                        setTimeout(() => feedbackForm.style.opacity = '1', 50);
                    }, 500);
                }, 4000);

            }, 300);
        });
    }

});

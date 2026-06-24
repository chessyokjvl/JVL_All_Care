const API_URL = "https://script.google.com/macros/s/AKfycbzgOIQbOqt2UhbeihwV1uctV8EVFLo6SBNO5Zny7Yh_UPUON6hTp1_O-5XIp4jupGqzQg/exec";

document.addEventListener('DOMContentLoaded', () => {
    initSidebarMobile();
    initNavigation();
    loadView('dashboard'); // เริ่มต้นที่หน้า Dashboard
});

// ==========================================
// 1. ระบบจัดการเมนูมือถือ (Hamburger Menu) ที่เสถียรขึ้น
// ==========================================
function initSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');

    function toggleMenu() {
        sidebar.classList.toggle('-translate-x-full');
        backdrop.classList.toggle('hidden');
    }

    // ผูก Event Listener แทน onClick ใน HTML
    openBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', toggleMenu);
}

// ==========================================
// 2. ระบบ Navigation & Routing
// ==========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            loadView(target);
            
            // ปิดเมนูอัตโนมัติบนมือถือหลังกดเลือกเมนู
            if (window.innerWidth < 1024) {
                document.getElementById('sidebar').classList.add('-translate-x-full');
                document.getElementById('sidebarBackdrop').classList.add('hidden');
            }
        });
    });
}

function loadView(view) {
    const content = document.getElementById('appContent');
    const pageTitle = document.getElementById('pageTitle');
    
    // อัปเดตแถบสีเมนู (Active State)
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-blue-800', 'border-l-4', 'border-yellow-400');
    });
    const activeNav = document.querySelector(`[data-target="${view}"]`);
    if (activeNav) {
        activeNav.classList.add('bg-blue-800', 'border-l-4', 'border-yellow-400');
    }

    if (view === 'dashboard') {
        pageTitle.innerText = "หน้าหลัก";
        content.innerHTML = renderDashboardHTML();
        fetchPatients();
    } else if (view === 'register') {
        pageTitle.innerText = "ลงทะเบียนผู้ป่วยใหม่";
        content.innerHTML = renderRegisterHTML();
    } else if (view === 'er_screening') {
        pageTitle.innerText = "คัดกรองพฤติกรรมรุนแรง (OAS)";
        content.innerHTML = renderERScreeningHTML();
    }
}

// ==========================================
// 3. หน้า Dashboard (ดีไซน์ตาม Mockup)
// ==========================================
function renderDashboardHTML() {
    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-blue-500">
                <div>
                    <p class="text-sm font-medium text-slate-500">ผู้ป่วยทั้งหมด</p>
                    <p class="text-3xl font-bold text-blue-900 mt-1" id="count-all">-</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                    <i class="fa-solid fa-users"></i>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-yellow-400">
                <div>
                    <p class="text-sm font-medium text-slate-500">ผู้ป่วย 3S</p>
                    <p class="text-3xl font-bold text-slate-800 mt-1" id="count-3s">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 text-xl">
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-green-500">
                <div>
                    <p class="text-sm font-medium text-slate-500">ผู้ป่วย Prolong Phasing</p>
                    <p class="text-3xl font-bold text-slate-800 mt-1" id="count-prolong">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-xl">
                    <i class="fa-solid fa-clock"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-red-400">
                <div>
                    <p class="text-sm font-medium text-slate-500">Re-Admit (28 วัน)</p>
                    <p class="text-3xl font-bold text-slate-800 mt-1" id="count-readmit">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">
                    <i class="fa-solid fa-rotate-left"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 class="text-lg font-bold text-blue-900">รายชื่อผู้ป่วยล่าสุด</h3>
                <div class="flex w-full sm:w-auto gap-2">
                    <div class="relative flex-1 sm:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="ค้นหา HN, ชื่อ..." class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>
                    <button onclick="fetchPatients()" class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 font-medium">
                        รีเฟรช
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 text-slate-500 text-sm">
                        <tr>
                            <th class="px-6 py-3 font-medium">HN / CID</th>
                            <th class="px-6 py-3 font-medium">ชื่อ-สกุล</th>
                            <th class="px-6 py-3 font-medium">กลุ่มโรค</th>
                            <th class="px-6 py-3 font-medium">วันที่ลงทะเบียน</th>
                            <th class="px-6 py-3 font-medium text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="patient-table-body" class="divide-y divide-slate-100 text-sm">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function fetchPatients() {
    const tbody = document.getElementById('patient-table-body');
    try {
        const response = await fetch(`${API_URL}?action=getPatients`);
        const result = await response.json();
        
        window.patientData = result.data; 
        
        if (result.status === 'success' && result.data.length > 0) {
            // อัปเดตตัวเลขหน้าบัตร
            document.getElementById('count-all').innerText = result.data.length;

            tbody.innerHTML = result.data.map(p => `
                <tr class="hover:bg-slate-50 transition patient-row">
                    <td class="px-6 py-4">
                        <div class="font-bold text-blue-700">${p.HN || '-'}</div>
                        <div class="text-xs text-slate-400">${p.CID || '-'}</div>
                    </td>
                    <td class="px-6 py-4 font-medium text-slate-700">
                        ${p.Prefix || ''}${p.FirstName || ''} ${p.LastName || ''}
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                            ${p.Principal_Dx || '-'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500">
                        ${p.RegisterDate ? new Date(p.RegisterDate).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="goToERScreening('${p.HN}')" class="text-yellow-600 hover:text-white border border-yellow-500 hover:bg-yellow-500 px-3 py-1.5 rounded-md text-xs transition font-medium">
                            <i class="fa-solid fa-clipboard-check mr-1"></i> ประเมิน
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ป่วย</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">ขัดข้องในการเชื่อมต่อฐานข้อมูล</td></tr>`;
    }
}

function filterTable() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    document.querySelectorAll(".patient-row").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

function goToERScreening(hn) {
    loadView('er_screening');
    setTimeout(() => {
        const hnInput = document.getElementById('er_hn');
        if(hnInput) {
            hnInput.value = hn;
            searchPatientER();
        }
    }, 100);
}

// ==========================================
// 4. หน้าฟอร์มต่างๆ (ย่อมาเพื่อความกระชับ)
// ==========================================
function renderRegisterHTML() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
            <h3 class="text-lg font-bold text-blue-900 mb-6 border-b border-slate-100 pb-4">แบบฟอร์มลงทะเบียนผู้ป่วย</h3>
            <form id="registerForm" onsubmit="submitRegisterForm(event)">
                <div class="grid grid-cols-2 gap-5 mb-5">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">HN</label>
                        <input type="text" id="hn" required class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">เลขบัตรประชาชน</label>
                        <input type="text" id="cid" class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                    </div>
                </div>
                <div class="grid grid-cols-12 gap-5 mb-5">
                    <div class="col-span-12 sm:col-span-3">
                        <label class="block text-sm font-medium text-slate-700 mb-1">คำนำหน้า</label>
                        <select id="prefix" class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                            <option>นาย</option><option>นาง</option><option>นางสาว</option>
                        </select>
                    </div>
                    <div class="col-span-12 sm:col-span-4">
                        <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อ</label>
                        <input type="text" id="fname" required class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>
                    <div class="col-span-12 sm:col-span-5">
                        <label class="block text-sm font-medium text-slate-700 mb-1">นามสกุล</label>
                        <input type="text" id="lname" required class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>
                </div>
                <div class="mb-8">
                    <label class="block text-sm font-medium text-slate-700 mb-1">กลุ่มโรคหลัก</label>
                    <select id="dx" class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                        <option value="F15.5">F15.5 (แอมเฟตามีน)</option>
                        <option value="F20">F20 (จิตเภท)</option>
                        <option value="F10">F10 (สุรา)</option>
                        <option value="F32">F32 (ซึมเศร้า)</option>
                        <option value="General">ทั่วไป</option>
                    </select>
                </div>
                <div class="flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" id="btnSubmit" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition font-medium">
                        บันทึกข้อมูลผู้ป่วย
                    </button>
                </div>
            </form>
        </div>
    `;
}

// (ฟังก์ชัน submitRegisterForm, renderERScreeningHTML, searchPatientER, calculateOAS, submitERScreening ยังคงใช้ Logic เดิมจากรอบที่แล้วได้เลยครับ เพียงแค่นำมาวางต่อท้ายที่นี่)

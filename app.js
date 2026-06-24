const API_URL = "https://script.google.com/macros/s/AKfycbzgOIQbOqt2UhbeihwV1uctV8EVFLo6SBNO5Zny7Yh_UPUON6hTp1_O-5XIp4jupGqzQg/exec";

document.addEventListener('DOMContentLoaded', () => {
    initSidebarMobile();
    initNavigation();
    loadView('dashboard');
});

// ==========================================
// 1. ระบบจัดการเมนูมือถือ
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

    if(openBtn) openBtn.addEventListener('click', toggleMenu);
    if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if(backdrop) backdrop.addEventListener('click', toggleMenu);
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
// 3. หน้า Dashboard 
// ==========================================
function renderDashboardHTML() {
    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-xl shadow-sm border border-blue-100 p-5 flex items-center justify-between border-b-4 border-b-blue-500">
                <div>
                    <p class="text-sm font-medium text-blue-800">ผู้ป่วยทั้งหมด</p>
                    <p class="text-3xl font-bold text-blue-900 mt-1" id="count-all">-</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                    <i class="fa-solid fa-users"></i>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-blue-100 p-5 flex items-center justify-between border-b-4 border-b-yellow-400">
                <div>
                    <p class="text-sm font-medium text-blue-800">ผู้ป่วย 3S</p>
                    <p class="text-3xl font-bold text-blue-900 mt-1" id="count-3s">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 text-xl">
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-blue-100 p-5 flex items-center justify-between border-b-4 border-b-green-500">
                <div>
                    <p class="text-sm font-medium text-blue-800">ผู้ป่วย Prolong Phasing</p>
                    <p class="text-3xl font-bold text-blue-900 mt-1" id="count-prolong">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-xl">
                    <i class="fa-solid fa-clock"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-blue-100 p-5 flex items-center justify-between border-b-4 border-b-red-400">
                <div>
                    <p class="text-sm font-medium text-blue-800">Re-Admit (28 วัน)</p>
                    <p class="text-3xl font-bold text-blue-900 mt-1" id="count-readmit">0</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">
                    <i class="fa-solid fa-rotate-left"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-blue-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 class="text-lg font-bold text-blue-900">รายชื่อผู้ป่วยล่าสุด</h3>
                <div class="flex w-full sm:w-auto gap-2">
                    <div class="relative flex-1 sm:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="ค้นหา HN, ชื่อ..." class="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>
                    <button onclick="fetchPatients()" class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 font-medium">
                        รีเฟรช
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-blue-50 text-blue-800 text-sm">
                        <tr>
                            <th class="px-6 py-3 font-medium">HN / CID</th>
                            <th class="px-6 py-3 font-medium">ชื่อ-สกุล</th>
                            <th class="px-6 py-3 font-medium">กลุ่มโรค</th>
                            <th class="px-6 py-3 font-medium">วันที่ลงทะเบียน</th>
                            <th class="px-6 py-3 font-medium text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="patient-table-body" class="divide-y divide-blue-50 text-sm">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-blue-400">กำลังโหลดข้อมูล...</td></tr>
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
            document.getElementById('count-all').innerText = result.data.length;

            tbody.innerHTML = result.data.map(p => `
                <tr class="hover:bg-blue-50 transition patient-row">
                    <td class="px-6 py-4">
                        <div class="font-bold text-blue-800">${p.HN || '-'}</div>
                        <div class="text-xs text-blue-500">${p.CID || '-'}</div>
                    </td>
                    <td class="px-6 py-4 font-medium text-blue-900">
                        ${p.Prefix || ''}${p.FirstName || ''} ${p.LastName || ''}
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                            ${p.Principal_Dx || '-'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-blue-600">
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
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-blue-500">ไม่พบข้อมูลผู้ป่วย</td></tr>`;
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
// 4. หน้าฟอร์มลงทะเบียน
// ==========================================
function renderRegisterHTML() {
    return `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-blue-100 max-w-3xl mx-auto">
            <h3 class="text-lg font-bold text-blue-900 mb-6 border-b border-blue-100 pb-4">แบบฟอร์มลงทะเบียนผู้ป่วย</h3>
            <form id="registerForm" onsubmit="submitRegisterForm(event)">
                <div class="grid grid-cols-2 gap-5 mb-5">
                    <div>
                        <label class="block text-sm font-medium text-blue-900 mb-1">HN</label>
                        <input type="text" id="hn" required class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-blue-900 mb-1">เลขบัตรประชาชน</label>
                        <input type="text" id="cid" class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>
                </div>
                <div class="grid grid-cols-12 gap-5 mb-5">
                    <div class="col-span-12 sm:col-span-3">
                        <label class="block text-sm font-medium text-blue-900 mb-1">คำนำหน้า</label>
                        <select id="prefix" class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                            <option>นาย</option><option>นาง</option><option>นางสาว</option>
                        </select>
                    </div>
                    <div class="col-span-12 sm:col-span-4">
                        <label class="block text-sm font-medium text-blue-900 mb-1">ชื่อ</label>
                        <input type="text" id="fname" required class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>
                    <div class="col-span-12 sm:col-span-5">
                        <label class="block text-sm font-medium text-blue-900 mb-1">นามสกุล</label>
                        <input type="text" id="lname" required class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>
                </div>
                <div class="mb-8">
                    <label class="block text-sm font-medium text-blue-900 mb-1">กลุ่มโรคหลัก</label>
                    <select id="dx" class="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                        <option value="F15.5">F15.5 (แอมเฟตามีน)</option>
                        <option value="F20">F20 (จิตเภท)</option>
                        <option value="F10">F10 (สุรา)</option>
                        <option value="F32">F32 (ซึมเศร้า)</option>
                        <option value="General">ทั่วไป</option>
                    </select>
                </div>
                <div class="flex justify-end pt-4 border-t border-blue-100">
                    <button type="submit" id="btnSubmit" class="bg-blue-800 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition font-bold">
                        บันทึกข้อมูลผู้ป่วย
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function submitRegisterForm(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...';
    btn.disabled = true;

    const payload = {
        action: 'registerPatient',
        data: {
            HN: document.getElementById('hn').value,
            CID: document.getElementById('cid').value,
            Prefix: document.getElementById('prefix').value,
            FirstName: document.getElementById('fname').value,
            LastName: document.getElementById('lname').value,
            Principal_Dx: document.getElementById('dx').value
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            Swal.fire('สำเร็จ!', result.message, 'success');
            document.getElementById('registerForm').reset();
            setTimeout(() => loadView('dashboard'), 1500);
        } else {
            Swal.fire('เกิดข้อผิดพลาด', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('ข้อผิดพลาดระบบ', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// 5. หน้าประเมิน ER Screening (OAS)
// ==========================================
function renderERScreeningHTML() {
    return `
        <div class="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 class="text-lg font-bold text-blue-900 mb-4 border-b border-blue-100 pb-4">
                <i class="fa-solid fa-truck-medical text-yellow-500 mr-2"></i> แบบคัดกรองพฤติกรรมรุนแรงแรกรับ (OAS)
            </h3>
            <form id="erScreeningForm" onsubmit="submitERScreening(event)">
                
                <div class="mb-6 bg-blue-50 p-5 rounded-lg border border-blue-100">
                    <label class="block text-sm font-medium text-blue-900 mb-2">รหัสผู้ป่วย (HN)</label>
                    <div class="flex space-x-2">
                        <input type="text" id="er_hn" required class="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ระบุ HN...">
                        <button type="button" onclick="searchPatientER()" class="bg-blue-800 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition">
                            <i class="fa-solid fa-magnifying-glass"></i> ค้นหา
                        </button>
                    </div>
                    <div id="er_patient_info" class="mt-3 text-sm font-medium hidden"></div>
                </div>

                <div class="mb-6 space-y-4">
                    <label class="block text-base font-bold text-blue-900">พฤติกรรมรุนแรงที่พบ (เลือกข้อที่รุนแรงที่สุด)</label>
                    
                    <div class="flex items-start p-3 border border-blue-100 rounded-lg hover:bg-blue-50 cursor-pointer" onclick="document.getElementById('oas_0').click()">
                        <input type="radio" id="oas_0" name="oas_score" value="0" class="mt-1 mr-3 w-4 h-4 text-blue-600" checked onchange="calculateOAS()">
                        <label for="oas_0" class="text-sm text-blue-900 cursor-pointer">ไม่มีพฤติกรรมรุนแรง</label>
                    </div>
                    <div class="flex items-start p-3 border border-blue-100 rounded-lg hover:bg-blue-50 cursor-pointer" onclick="document.getElementById('oas_1').click()">
                        <input type="radio" id="oas_1" name="oas_score" value="1" class="mt-1 mr-3 w-4 h-4 text-blue-600" onchange="calculateOAS()">
                        <label for="oas_1" class="text-sm text-blue-900 cursor-pointer"><b class="text-yellow-600">ระดับ 1:</b> หงุดหงิด ด่าทอเสียงดัง ทุบตีสิ่งของเบาๆ (Verbal / Mild Object Aggression)</label>
                    </div>
                    <div class="flex items-start p-3 border border-blue-100 rounded-lg hover:bg-blue-50 cursor-pointer" onclick="document.getElementById('oas_2').click()">
                        <input type="radio" id="oas_2" name="oas_score" value="2" class="mt-1 mr-3 w-4 h-4 text-blue-600" onchange="calculateOAS()">
                        <label for="oas_2" class="text-sm text-blue-900 cursor-pointer"><b class="text-orange-500">ระดับ 2:</b> ขว้างปาสิ่งของ ทำลายข้าวของเสียหาย พยายามทำร้ายตัวเอง/ผู้อื่นแต่ไม่รุนแรง</label>
                    </div>
                    <div class="flex items-start p-3 border border-blue-100 rounded-lg hover:bg-blue-50 cursor-pointer" onclick="document.getElementById('oas_3').click()">
                        <input type="radio" id="oas_3" name="oas_score" value="3" class="mt-1 mr-3 w-4 h-4 text-blue-600" onchange="calculateOAS()">
                        <label for="oas_3" class="text-sm text-blue-900 cursor-pointer"><b class="text-red-500">ระดับ 3:</b> ทำร้ายผู้อื่นชัดเจน มีอาวุธ ทำร้ายตัวเองรุนแรง (Severe Physical Aggression)</label>
                    </div>
                </div>

                <div id="oas_result_box" class="mb-6 p-4 rounded-lg border hidden transition">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-blue-900">ระดับความรุนแรง: <span id="lbl_oas_level" class="text-lg"></span></span>
                    </div>
                    <div class="text-sm text-blue-900"><span class="font-bold">คำแนะนำ:</span> <span id="lbl_oas_action"></span></div>
                </div>

                <div class="flex justify-end pt-4 border-t border-blue-100">
                    <button type="submit" id="btnSubmitER" class="bg-yellow-500 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-yellow-600 transition font-bold flex items-center">
                        <i class="fa-solid fa-save mr-2"></i> บันทึกการประเมิน
                    </button>
                </div>
            </form>
        </div>
    `;
}

function searchPatientER() {
    const hn = document.getElementById('er_hn').value;
    const infoBox = document.getElementById('er_patient_info');
    
    if (!window.patientData) {
        infoBox.innerHTML = "กรุณากลับไปหน้า Dashboard เพื่อโหลดข้อมูลก่อน";
        infoBox.className = "mt-3 text-sm font-medium text-red-500";
        return;
    }

    const patient = window.patientData.find(p => p.HN == hn);
    
    if (patient) {
        infoBox.innerHTML = `พบผู้ป่วย: <b>${patient.Prefix || ''}${patient.FirstName} ${patient.LastName}</b> <span class="ml-2 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Dx: ${patient.Principal_Dx}</span>`;
        infoBox.className = "mt-3 text-sm font-medium p-3 bg-white border border-blue-200 rounded-lg text-blue-900";
    } else {
        infoBox.innerHTML = "ไม่พบข้อมูลผู้ป่วยในระบบ (กรุณาลงทะเบียนก่อน)";
        infoBox.className = "mt-3 text-sm font-medium text-red-500";
    }
}

function calculateOAS() {
    const score = parseInt(document.querySelector('input[name="oas_score"]:checked').value);
    const box = document.getElementById('oas_result_box');
    const lblLevel = document.getElementById('lbl_oas_level');
    const lblAction = document.getElementById('lbl_oas_action');

    box.className = "mb-6 p-4 rounded-lg border transition";
    
    if (score === 0) {
        box.classList.add('bg-blue-50', 'border-blue-200');
        lblLevel.innerHTML = `<span class="text-blue-600">ปกติ (Level 0)</span>`;
        lblAction.innerText = "ซักประวัติและดำเนินการตามขั้นตอนปกติ";
    } else if (score === 1) {
        box.classList.add('bg-yellow-50', 'border-yellow-200');
        lblLevel.innerHTML = `<span class="text-yellow-600">ความรุนแรงระดับ 1</span>`;
        lblAction.innerText = "เฝ้าระวังใกล้ชิด ใช้เทคนิคเจรจาต่อรอง (De-escalation) หากไม่สงบพิจารณาฉีดยา";
    } else if (score === 2) {
        box.classList.add('bg-orange-50', 'border-orange-200');
        lblLevel.innerHTML = `<span class="text-orange-600">ความรุนแรงระดับ 2</span>`;
        lblAction.innerText = "เตรียมทีมเจรจา (Show of force) พิจารณาฉีดยา และเตรียมอุปกรณ์ผูกยึด";
    } else if (score === 3) {
        box.classList.add('bg-red-50', 'border-red-200');
        lblLevel.innerHTML = `<span class="text-red-600">ความรุนแรงระดับ 3 (วิกฤต)</span>`;
        lblAction.innerText = "เรียก Code ความรุนแรง, ทำการผูกยึด (Physical Restraint) ทันที และให้ยาฉีด";
    }
}

async function submitERScreening(e) {
    e.preventDefault();
    const hn = document.getElementById('er_hn').value;
    const scoreElement = document.querySelector('input[name="oas_score"]:checked');
    
    if(!scoreElement) return;
    const score = scoreElement.value;
    
    let level = "0", action = "ปกติ";
    if(score == "1") { level = "1"; action = "เฝ้าระวัง/เจรจา"; }
    else if(score == "2") { level = "2"; action = "เตรียมผูกยึด/ฉีดยา"; }
    else if(score == "3") { level = "3"; action = "ผูกยึดทันที (Code รุนแรง)"; }

    const payload = {
        action: 'saveScreeningER',
        data: {
            HN: hn,
            OAS_Score: score,
            OAS_Level: level,
            ActionTaken: action,
            EvaluatorID: 'admin'
        }
    };

    const btn = document.getElementById('btnSubmitER');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...';
    btn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            Swal.fire('บันทึกสำเร็จ!', 'บันทึกการประเมินแรกรับเรียบร้อยแล้ว', 'success');
            document.getElementById('erScreeningForm').reset();
            document.getElementById('oas_result_box').classList.add('hidden');
            document.getElementById('er_patient_info').classList.add('hidden');
        } else {
            Swal.fire('ผิดพลาด', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบได้', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

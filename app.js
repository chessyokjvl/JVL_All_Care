// ใส่ URL ของ Web App ที่ Deploy มา
const API_URL = "https://script.google.com/macros/s/AKfycbzgOIQbOqt2UhbeihwV1uctV8EVFLo6SBNO5Zny7Yh_UPUON6hTp1_O-5XIp4jupGqzQg/exec";

// เมื่อโหลดหน้าเว็บเสร็จ ให้แสดงหน้า Dashboard เป็นค่าเริ่มต้น
document.addEventListener('DOMContentLoaded', () => {
    loadView('dashboard');
});

// ฟังก์ชันสลับหน้าจอ (Routing)
function loadView(view) {
    const content = document.getElementById('app-content');
    const pageTitle = document.getElementById('page-title');

    if (view === 'dashboard') {
        pageTitle.innerText = "Dashboard สถานะผู้ป่วย";
        content.innerHTML = renderDashboardHTML();
        fetchPatients(); 
    } 
    else if (view === 'register') {
        pageTitle.innerText = "ลงทะเบียนผู้ป่วยใหม่";
        content.innerHTML = renderRegisterHTML();
    }
    // เพิ่มเงื่อนไขให้โหลดหน้า ER Screening ได้แล้ว
    else if (view === 'er_screening') {
        pageTitle.innerText = "คัดกรองพฤติกรรมรุนแรง (OAS)";
        content.innerHTML = renderERScreeningHTML();
    }
}

function renderDashboardHTML() {
    return `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">รายชื่อผู้ป่วยที่ลงทะเบียนแล้ว</h3>
                
                <div class="flex space-x-2 w-1/2 justify-end">
                    <div class="relative w-2/3">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <i class="fa-solid fa-search text-gray-400"></i>
                        </div>
                        <input type="text" id="searchInput" onkeyup="filterTable()" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2" placeholder="ค้นหา HN, ชื่อ, นามสกุล หรือกลุ่มโรค...">
                    </div>
                    <button onclick="fetchPatients()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        <i class="fa-solid fa-rotate-right"></i> รีเฟรช
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="patientTable">
                    <thead>
                        <tr class="bg-gray-100 text-gray-600 text-sm border-b">
                            <th class="p-3 w-24">HN</th>
                            <th class="p-3 w-32">CID</th>
                            <th class="p-3">ชื่อ-สกุล</th>
                            <th class="p-3 w-28">กลุ่มโรค</th>
                            <th class="p-3 w-32">ลงทะเบียน</th>
                            <th class="p-3 text-center w-32">จัดการ</th> </tr>
                    </thead>
                    <tbody id="patient-table-body">
                        <tr><td colspan="6" class="p-4 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function fetchPatients() {
    const tbody = document.getElementById('patient-table-body');
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...</td></tr>`;
    
    try {
        const response = await fetch(`${API_URL}?action=getPatients`);
        const result = await response.json();
        
        // เก็บข้อมูลไว้ในตัวแปร Global เผื่อใช้ที่อื่น (เช่น ตอนค้นหาชื่อในหน้า ER)
        window.patientData = result.data; 
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data.map(p => `
                <tr class="border-b hover:bg-gray-50 text-sm patient-row">
                    <td class="p-3 font-medium text-blue-600">${p.HN || '-'}</td>
                    <td class="p-3 text-gray-500">${p.CID || '-'}</td>
                    <td class="p-3">${p.Prefix || ''}${p.FirstName || ''} ${p.LastName || ''}</td>
                    <td class="p-3"><span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">${p.Principal_Dx || '-'}</span></td>
                    <td class="p-3 text-gray-500">${p.RegisterDate ? new Date(p.RegisterDate).toLocaleDateString('th-TH') : '-'}</td>
                    <td class="p-3 text-center">
                        <button onclick="goToERScreening('${p.HN}')" class="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition shadow-sm">
                            <i class="fa-solid fa-truck-medical"></i> ประเมิน OAS
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">ยังไม่มีข้อมูลผู้ป่วยในระบบ</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
        console.error('Error fetching patients:', error);
    }
}
// ฟังก์ชัน Universal Search (กรองข้อมูลในตาราง)
function filterTable() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".patient-row");
    
    rows.forEach(row => {
        // ดึงข้อความทั้งหมดในแถวนั้นมาแปลงเป็นตัวพิมพ์เล็กแล้วหาคำที่ตรงกัน
        const textContent = row.innerText.toLowerCase();
        if (textContent.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// ฟังก์ชันลัด: เปลี่ยนหน้าไป ER พร้อมส่ง HN ไปค้นหาให้อัตโนมัติ
function goToERScreening(hn) {
    // โหลดหน้า ER ก่อน
    loadView('er_screening');
    
    // หน่วงเวลาเล็กน้อยเพื่อให้ HTML Render เสร็จก่อนไปเติมค่า
    setTimeout(() => {
        const hnInput = document.getElementById('er_hn');
        if(hnInput) {
            hnInput.value = hn;
            searchPatientER(); // เรียกฟังก์ชันค้นหาชื่อทันที
        }
    }, 100);
}
// ==========================================
// ส่วนของการบันทึกข้อมูล (POST)
// ==========================================

function renderRegisterHTML() {
    return `
        <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
            <form id="registerForm" onsubmit="submitRegisterForm(event)">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">HN</label>
                        <input type="text" id="hn" required class="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน (CID)</label>
                        <input type="text" id="cid" class="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4 mb-4">
                    <div class="col-span-3">
                        <label class="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
                        <select id="prefix" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                            <option value="นาย">นาย</option>
                            <option value="นาง">นาง</option>
                            <option value="นางสาว">นางสาว</option>
                        </select>
                    </div>
                    <div class="col-span-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                        <input type="text" id="fname" required class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                    </div>
                    <div class="col-span-5">
                        <label class="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                        <input type="text" id="lname" required class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">กลุ่มโรคหลัก (Principal Dx)</label>
                    <select id="dx" class="w-full border-gray-300 rounded-md shadow-sm border p-2">
                        <option value="F15.5">F15.5 (แอมเฟตามีน)</option>
                        <option value="F20">F20 (จิตเภท)</option>
                        <option value="F10">F10 (สุรา)</option>
                        <option value="F32">F32 (ซึมเศร้า)</option>
                        <option value="General">อื่นๆ ทั่วไป</option>
                    </select>
                </div>

                <div class="flex justify-end">
                    <button type="submit" id="btnSubmit" class="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center">
                        <i class="fa-solid fa-save mr-2"></i> บันทึกข้อมูล
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function submitRegisterForm(e) {
    e.preventDefault(); // ป้องกันการ Refresh หน้าเว็บ
    
    // เปลี่ยนปุ่มเป็นสถานะกำลังโหลด
    const btn = document.getElementById('btnSubmit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...';
    btn.disabled = true;

    // รวบรวมข้อมูลจากฟอร์ม
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
            // ใช้ text/plain แก้ปัญหา CORS Preflight ชั่วคราวเมื่อยิงเข้า GAS
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            Swal.fire('สำเร็จ!', result.message, 'success');
            document.getElementById('registerForm').reset();
            // ย้ายกลับไปหน้า Dashboard อัตโนมัติหลังบันทึกเสร็จ
            setTimeout(() => loadView('dashboard'), 1500);
        } else {
            Swal.fire('เกิดข้อผิดพลาด', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('ข้อผิดพลาดระบบ', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
        console.error(error);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// ส่วนของการประเมิน ER Screening (OAS)
// ==========================================

function renderERScreeningHTML() {
    return `
        <div class="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-bold text-red-600 mb-4 border-b pb-2">
                <i class="fa-solid fa-truck-medical"></i> แบบคัดกรองพฤติกรรมรุนแรงแรกรับ (OAS)
            </h3>
            <form id="erScreeningForm" onsubmit="submitERScreening(event)">
                
                <div class="mb-6 bg-gray-50 p-4 rounded border">
                    <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผู้ป่วย (HN)</label>
                    <div class="flex space-x-2">
                        <input type="text" id="er_hn" required class="w-1/3 border-gray-300 rounded-md shadow-sm border p-2 focus:ring-red-500 focus:border-red-500" placeholder="ระบุ HN...">
                        <button type="button" onclick="searchPatientER()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                            <i class="fa-solid fa-magnifying-glass"></i> ค้นหา
                        </button>
                    </div>
                    <div id="er_patient_info" class="mt-2 text-sm text-blue-600 font-medium hidden">
                        </div>
                </div>

                <div class="mb-6 space-y-4">
                    <label class="block text-base font-medium text-gray-800">พฤติกรรมรุนแรงที่พบ (เลือกข้อที่รุนแรงที่สุด)</label>
                    
                    <div class="flex items-start">
                        <input type="radio" id="oas_0" name="oas_score" value="0" class="mt-1 mr-2" checked onchange="calculateOAS()">
                        <label for="oas_0" class="text-sm">ไม่มีพฤติกรรมรุนแรง</label>
                    </div>
                    <div class="flex items-start">
                        <input type="radio" id="oas_1" name="oas_score" value="1" class="mt-1 mr-2 text-yellow-500" onchange="calculateOAS()">
                        <label for="oas_1" class="text-sm"><b>ระดับ 1:</b> หงุดหงิด ด่าทอเสียงดัง ทุบตีสิ่งของเบาๆ (Verbal / Mild Object Aggression)</label>
                    </div>
                    <div class="flex items-start">
                        <input type="radio" id="oas_2" name="oas_score" value="2" class="mt-1 mr-2 text-orange-500" onchange="calculateOAS()">
                        <label for="oas_2" class="text-sm"><b>ระดับ 2:</b> ขว้างปาสิ่งของ ทำลายข้าวของเสียหาย พยายามทำร้ายตัวเอง/ผู้อื่นแต่ไม่รุนแรง</label>
                    </div>
                    <div class="flex items-start">
                        <input type="radio" id="oas_3" name="oas_score" value="3" class="mt-1 mr-2 text-red-600" onchange="calculateOAS()">
                        <label for="oas_3" class="text-sm"><b>ระดับ 3:</b> ทำร้ายผู้อื่นชัดเจน มีอาวุธ ทำร้ายตัวเองรุนแรง (Severe Physical Aggression)</label>
                    </div>
                </div>

                <div id="oas_result_box" class="mb-6 p-4 rounded bg-gray-100 border hidden">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold">ระดับความรุนแรง: <span id="lbl_oas_level" class="text-lg"></span></span>
                    </div>
                    <div class="text-sm"><span class="font-bold">คำแนะนำ:</span> <span id="lbl_oas_action"></span></div>
                </div>

                <div class="flex justify-end">
                    <button type="submit" id="btnSubmitER" class="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700 flex items-center">
                        <i class="fa-solid fa-save mr-2"></i> บันทึกการประเมิน ER
                    </button>
                </div>
            </form>
        </div>
    `;
}

// ฟังก์ชันค้นหาชื่อผู้ป่วยจาก HN (จำลองการค้นหาจาก Data ที่โหลดมาแล้ว)
function searchPatientER() {
    const hn = document.getElementById('er_hn').value;
    const infoBox = document.getElementById('er_patient_info');
    
    // ดึงข้อมูลตารางที่เคยโหลดไว้จาก Dashboard (วิธีแบบง่ายสำหรับ Prototype)
    fetch(`${API_URL}?action=getPatients`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                const patient = result.data.find(p => p.HN == hn);
                if (patient) {
                    infoBox.innerHTML = `พบผู้ป่วย: ${patient.Prefix || ''}${patient.FirstName} ${patient.LastName} [Dx: ${patient.Principal_Dx}]`;
                    infoBox.classList.remove('hidden');
                    infoBox.classList.remove('text-red-600');
                    infoBox.classList.add('text-blue-600');
                } else {
                    infoBox.innerHTML = "ไม่พบข้อมูลผู้ป่วยในระบบ (กรุณาลงทะเบียนก่อน)";
                    infoBox.classList.remove('hidden', 'text-blue-600');
                    infoBox.classList.add('text-red-600');
                }
            }
        });
}

// ฟังก์ชันคำนวณ OAS และแสดง Action อัตโนมัติ
function calculateOAS() {
    const score = parseInt(document.querySelector('input[name="oas_score"]:checked').value);
    const box = document.getElementById('oas_result_box');
    const lblLevel = document.getElementById('lbl_oas_level');
    const lblAction = document.getElementById('lbl_oas_action');

    box.classList.remove('hidden', 'bg-gray-100', 'bg-yellow-100', 'bg-orange-100', 'bg-red-100');
    
    if (score === 0) {
        box.classList.add('bg-gray-100');
        lblLevel.innerHTML = `<span class="text-gray-600">ปกติ (Level 0)</span>`;
        lblAction.innerText = "ซักประวัติและดำเนินการตามขั้นตอนปกติ";
    } else if (score === 1) {
        box.classList.add('bg-yellow-100');
        lblLevel.innerHTML = `<span class="text-yellow-600">ความรุนแรงระดับ 1</span>`;
        lblAction.innerText = "เฝ้าระวังใกล้ชิด ใช้เทคนิคเจรจาต่อรอง (De-escalation) หากไม่สงบพิจารณาฉีดยา";
    } else if (score === 2) {
        box.classList.add('bg-orange-100');
        lblLevel.innerHTML = `<span class="text-orange-600">ความรุนแรงระดับ 2</span>`;
        lblAction.innerText = "เตรียมทีมเจรจา (Show of force) พิจารณาฉีดยา และเตรียมอุปกรณ์ผูกยึด";
    } else if (score === 3) {
        box.classList.add('bg-red-100');
        lblLevel.innerHTML = `<span class="text-red-600">ความรุนแรงระดับ 3 (วิกฤต)</span>`;
        lblAction.innerText = "เรียก Code ความรุนแรง, ทำการผูกยึด (Physical Restraint) ทันที และให้ยาฉีด";
    }
}

// ฟังก์ชันส่งข้อมูลเข้า API
async function submitERScreening(e) {
    e.preventDefault();
    const hn = document.getElementById('er_hn').value;
    const score = document.querySelector('input[name="oas_score"]:checked').value;
    
    // กำหนด Level และ Action เพื่อเก็บลง DB
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
            EvaluatorID: 'nurse_er_01' // จำลองชื่อผู้ล็อกอิน
        }
    };

    const btn = document.getElementById('btnSubmitER');
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
        btn.innerHTML = '<i class="fa-solid fa-save mr-2"></i> บันทึกการประเมิน ER';
        btn.disabled = false;
    }
}

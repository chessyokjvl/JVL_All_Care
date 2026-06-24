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
        fetchPatients(); // โหลดข้อมูลทันทีเมื่อเปิดหน้า
    } 
    else if (view === 'register') {
        pageTitle.innerText = "ลงทะเบียนผู้ป่วยใหม่";
        content.innerHTML = renderRegisterHTML();
    }
    // เพิ่มการเชื่อมโยงหน้าอื่นๆ ในอนาคตที่นี่
}

// ==========================================
// ส่วนของการดึงและแสดงข้อมูล (GET)
// ==========================================

function renderDashboardHTML() {
    return `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">รายชื่อผู้ป่วยที่ลงทะเบียนแล้ว</h3>
                <button onclick="fetchPatients()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    <i class="fa-solid fa-rotate-right"></i> รีเฟรชข้อมูล
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-100 text-gray-600 text-sm border-b">
                            <th class="p-3">HN</th>
                            <th class="p-3">CID</th>
                            <th class="p-3">ชื่อ-สกุล</th>
                            <th class="p-3">Principal Dx</th>
                            <th class="p-3">วันที่ลงทะเบียน</th>
                        </tr>
                    </thead>
                    <tbody id="patient-table-body">
                        <tr><td colspan="5" class="p-4 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
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
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data.map(p => `
                <tr class="border-b hover:bg-gray-50 text-sm">
                    <td class="p-3 font-medium text-blue-600">${p.HN || '-'}</td>
                    <td class="p-3">${p.CID || '-'}</td>
                    <td class="p-3">${p.Prefix || ''}${p.FirstName || ''} ${p.LastName || ''}</td>
                    <td class="p-3"><span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">${p.Principal_Dx || '-'}</span></td>
                    <td class="p-3">${p.RegisterDate ? new Date(p.RegisterDate).toLocaleDateString('th-TH') : '-'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">ยังไม่มีข้อมูลผู้ป่วยในระบบ</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
        console.error('Error fetching patients:', error);
    }
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

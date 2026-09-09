/* ============================================================
   monthCard.js —— 月卡管理列表页
   权限控制：
     管理员 -> 查看全部，可增删改续费
     车主   -> 仅看自己的卡，可购买/续费/查看
     未登录  -> 查看全部，仅查询+查看（无增删改）
   功能：查询筛选、表格渲染、前端分页、全选/批量删除、
        单条删除、查看/编辑/续费弹窗、跨标签页实时更新。
   ============================================================ */

// ---------- 数据源与分页状态 ----------
let allData = loadData();         // 全部月卡数据
let filtered = allData;           // 筛选后数据（表格渲染源）
let currentPage = 1;
let pageSize = 5;
let modalMode = '';
let modalId = null;

// ---------- 获取页面元素 ----------
const tbody        = document.getElementById('tbody');
const checkAll     = document.getElementById('checkAll');
const totalCountEl = document.getElementById('totalCount');
const pageInfoEl   = document.getElementById('pageInfo');
const btnPrev      = document.getElementById('btnPrev');
const btnNext      = document.getElementById('btnNext');
const modal        = document.getElementById('modal');
const modalTitle   = document.getElementById('modalTitle');
const modalForm    = document.getElementById('modalForm');
const btnModalSave = document.getElementById('btnModalSave');

/* ========== 权限初始化 ========== */
function initPermission() {
    // 车主模式：标题改为"我的月卡"，隐藏复选框列
    if (isUser()) {
        document.getElementById('pageTitle').innerHTML =
            '我的月卡<span id="size"> ——查看与管理我的月卡</span>';
        document.getElementById('dataTable').classList.add('no-select');
    }
    renderActionButtons();
}

// 根据权限渲染操作按钮区（添加/购买/批量删除）
function renderActionButtons() {
    const box = document.getElementById('actionButtons');
    if (isAdmin()) {
        box.innerHTML = `<a class="button" href="addMonthCard.html">➕ 添加月卡</a>
                         <button type="button" class="button btn-red" id="btnBatchDel">🗑 批量删除</button>`;
        document.getElementById('btnBatchDel').addEventListener('click', batchDelete);
    } else if (isUser()) {
        box.innerHTML = `<a class="button" href="addMonthCard.html">🛒 购买月卡</a>`;
    }
    // 未登录：无操作按钮
}

/* ========== 一、数据范围（车主只看自己的卡） ========== */
function getMyData() {
    if (isUser()) {
        const phone = currentUserPhone();
        return allData.filter(c => c.phone === phone);
    }
    return allData;   // 管理员/未登录看全部
}

/* ========== 二、表格渲染函数 ========== */
function renderTable() {
    // 重新读取最新数据（实时更新）
    allData = loadData();
    filtered = applyFilterData(getMyData());

    // 页码越界保护
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    // slice 切片
    const start = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    // 根据权限渲染操作列按钮
    const actions = c => {
        const view = `<a class="op-btn" data-action="view" data-id="${c.id}">查看</a>`;
        if (isAdmin()) {
            return `${view}
                    <a class="op-btn" data-action="renew" data-id="${c.id}">续费</a>
                    <a class="op-btn" data-action="edit" data-id="${c.id}">编辑</a>
                    <a class="op-btn op-del" data-action="delete" data-id="${c.id}">删除</a>`;
        }
        if (isUser()) {
            return `${view}
                    <a class="op-btn" data-action="renew" data-id="${c.id}">续费</a>`;
        }
        return view;   // 未登录仅查看
    };

    // 拼接表格行
    tbody.innerHTML = pageData.map((c, i) => `
        <tr>
            <td class="col-check"><input type="checkbox" class="row-check" data-id="${c.id}"></td>
            <td>${start + i + 1}</td>
            <td>${c.ownerName}</td>
            <td>${c.phone}</td>
            <td>${c.plateNo}</td>
            <td>${c.cardType}</td>
            <td>${c.startDate}</td>
            <td>${c.endDate}</td>
            <td>￥${formatMoney(c.payAmount)}</td>
            <td>${c.status === 0 ? c.remainDay + ' 天' : '—'}</td>
            <td><span class="${c.status === 0 ? 'tag-ok' : 'tag-exp'}">${statusText(c.status)}</span></td>
            <td>${actions(c)}</td>
        </tr>`).join('') || `<tr><td colspan="12" class="empty">暂无月卡数据</td></tr>`;

    // 更新分页栏
    totalCountEl.textContent = filtered.length;
    pageInfoEl.textContent = `第 ${currentPage} / ${totalPages} 页`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
    checkAll.checked = false;
}

/* ========== 三、查询筛选 ========== */
function applyFilterData(source) {
    const kw = document.getElementById('searchKeyword').value.trim();
    const plate = document.getElementById('searchPlate').value.trim().toUpperCase();
    const st = document.getElementById('searchStatus').value;
    return source.filter(c =>
        (!kw || c.ownerName.includes(kw) || c.phone.includes(kw)) &&
        (!plate || c.plateNo.toUpperCase().includes(plate)) &&
        (st === '' || c.status === Number(st))
    );
}

document.getElementById('btnSearch').addEventListener('click', () => {
    currentPage = 1;
    renderTable();
});
document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('searchKeyword').value = '';
    document.getElementById('searchPlate').value = '';
    document.getElementById('searchStatus').value = '';
    currentPage = 1;
    renderTable();
});

/* ========== 四、分页 ========== */
btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
btnNext.addEventListener('click', () => {
    const total = Math.ceil(filtered.length / pageSize);
    if (currentPage < total) { currentPage++; renderTable(); }
});
document.getElementById('pageSize').addEventListener('change', e => {
    pageSize = Number(e.target.value);
    currentPage = 1;
    renderTable();
});

/* ========== 五、全选 / 批量删除 / 单条删除 ========== */
checkAll.addEventListener('change', () => {
    document.querySelectorAll('.row-check').forEach(cb => cb.checked = checkAll.checked);
});

function batchDelete() {
    const ids = [...document.querySelectorAll('.row-check:checked')].map(cb => Number(cb.dataset.id));
    if (ids.length === 0) { alert('请先勾选要删除的月卡记录'); return; }
    if (!confirm(`确定删除选中的 ${ids.length} 条月卡记录吗？`)) return;
    allData = allData.filter(c => !ids.includes(c.id));
    saveData(allData);
    renderTable();
}

// 单条删除 + 弹窗（事件委托）
tbody.addEventListener('click', e => {
    const btn = e.target.closest('.op-btn');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'delete') {
        if (confirm('确定删除该条月卡记录吗？')) {
            allData = allData.filter(c => c.id !== id);
            saveData(allData);
            renderTable();
        }
    } else {
        openModal(action, id);
    }
});

/* ========== 六、弹窗（查看 / 编辑 / 续费） ========== */
const vehicleFields = ['ownerName', 'phone', 'plateNo', 'cardType'];
const payFields = ['startDate', 'endDate', 'payAmount', 'payType'];

function openModal(mode, id) {
    const card = allData.find(c => c.id === id);
    if (!card) return;
    modalMode = mode;
    modalId = id;

    // 数据回填
    const f = modalForm;
    f.ownerName.value = card.ownerName;
    f.phone.value = card.phone;
    f.plateNo.value = card.plateNo;
    f.cardType.value = card.cardType;
    f.startDate.value = card.startDate;
    f.endDate.value = card.endDate;
    f.payAmount.value = card.payAmount;
    f.payType.value = card.payType;
    f.remainDay.value = card.remainDay;
    f.statusText.value = statusText(card.status);

    // 标题与字段只读控制
    modalTitle.textContent = { view: '查看月卡信息', edit: '编辑月卡', renew: '月卡续费' }[mode];

    // 车主续费时车辆信息全只读；管理员编辑时可改
    const canEditVehicle = isAdmin() && mode === 'edit';
    vehicleFields.forEach(n => f[n].disabled = !canEditVehicle);
    payFields.forEach(n => f[n].disabled = (mode === 'view'));
    f.remainDay.disabled = (mode !== 'renew');
    f.statusText.disabled = true;
    btnModalSave.style.display = (mode === 'view') ? 'none' : '';

    modal.classList.add('show');
}

function closeModal() { modal.classList.remove('show'); }
document.getElementById('btnModalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// 弹窗内修改日期时自动联动
['startDate', 'endDate'].forEach(n => {
    modalForm[n].addEventListener('change', () => {
        if (modalForm.endDate.value) {
            modalForm.remainDay.value = calcRemainDay(modalForm.endDate.value);
            modalForm.statusText.value = statusText(calcStatus(modalForm.endDate.value));
        }
    });
});

// 弹窗保存（编辑 / 续费）
btnModalSave.addEventListener('click', () => {
    const f = modalForm;
    const card = {
        id: modalId,
        ownerName: f.ownerName.value.trim(),
        phone: f.phone.value.trim(),
        plateNo: f.plateNo.value.trim().toUpperCase(),
        cardType: f.cardType.value,
        startDate: f.startDate.value,
        endDate: f.endDate.value,
        payAmount: f.payAmount.value,
        payType: f.payType.value
    };

    const err = validateCard(card);
    if (err) { alert(err); return; }

    card.payAmount = Number(card.payAmount);
    if (modalMode === 'renew') {
        card.remainDay = Number(f.remainDay.value) || 0;
        card.status = calcStatus(card.endDate);
    } else {
        normalize(card);
    }

    const idx = allData.findIndex(c => c.id === modalId);
    if (idx > -1) allData[idx] = card;
    saveData(allData);
    closeModal();
    renderTable();
});

/* ========== 七、跨标签页实时更新 ========== */
window.onDataChange = function() {
    renderTable();
    renderHeader();   // 登录状态可能变化
};

/* ========== 初始化 ========== */
initPermission();
renderTable();

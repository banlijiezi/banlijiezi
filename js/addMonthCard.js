/* ============================================================
   addMonthCard.js —— 增加 / 编辑月卡页面
   权限控制：
     未登录 -> 跳转登录页
     车主   -> 手机号/车牌号自动填充且只读
     管理员 -> 全部字段可编辑
   计费规则：选卡类型 -> 自动填价 + 计算结束日期 + 显示规则提示
   ============================================================ */

// ---------- 权限检查：未登录跳转登录页 ----------
if (!isLoggedIn()) {
    alert('请先登录后再操作月卡');
    location.href = 'login.html';
}

const allData = loadData();
const form    = document.getElementById('cardForm');
const formTip = document.getElementById('formTip');
const editId  = new URLSearchParams(location.search).get('id');

/* ========== 一、计费规则提示表格 ========== */
function renderBillingRules() {
    const body = document.getElementById('billingBody');
    body.innerHTML = Object.entries(BILLING_RULES).map(([type, r]) => `
        <tr>
            <td class="highlight">${type}</td>
            <td>￥${r.price}</td>
            <td>${r.days} 天</td>
            <td>${r.perDay}</td>
        </tr>`).join('');
}
renderBillingRules();

/* ========== 二、选卡类型 -> 自动填价 + 结束日期 + 提示 ========== */
function onCardTypeChange() {
    const type = form.cardType.value;
    const rule = BILLING_RULES[type];
    if (!rule) return;

    // 自动填充缴费金额
    form.payAmount.value = rule.price;

    // 显示规则提示文字
    document.getElementById('billingHint').textContent =
        `已选「${type}」：￥${rule.price} / ${rule.days}天（${rule.perDay}）`;

    // 若已有开始日期，自动计算结束日期 = 开始日期 + 有效天数
    if (form.startDate.value) {
        form.endDate.value = addDays(form.startDate.value, rule.days);
        fillAuto();
    }
}
form.cardType.addEventListener('change', onCardTypeChange);

/* ========== 三、开始日期变化 -> 按卡类型自动算结束日期 ========== */
document.getElementById('startDateInput').addEventListener('change', () => {
    const rule = BILLING_RULES[form.cardType.value];
    if (rule && form.startDate.value) {
        form.endDate.value = addDays(form.startDate.value, rule.days);
    }
    fillAuto();
});

/* ========== 四、结束日期变化 -> 自动计算剩余天数、状态 ========== */
function fillAuto() {
    if (form.endDate.value) {
        form.remainDay.value = calcRemainDay(form.endDate.value) + ' 天';
        form.statusText.value = statusText(calcStatus(form.endDate.value));
    }
}
form.endDate.addEventListener('change', fillAuto);

/* ========== 五、车主模式：预填注册信息且只读 ========== */
if (isUser() && !editId) {
    const s = getSession();
    // 将注册的姓名、手机号、车牌号自动带入月卡表单
    form.ownerName.value = s.username;
    form.ownerName.disabled = true;     // 车主不可改姓名
    form.phone.value = s.phone;
    form.phone.disabled = true;        // 车主不可改手机号
    if (s.plateNo) {
        form.plateNo.value = s.plateNo;
        form.plateNo.disabled = true;  // 车主不可改车牌号
    }
    // 标题改为"购买月卡"
    document.getElementById('pageTitle').innerHTML =
        '购买月卡<span id="size"> ——选择卡类型，填写信息</span>';
}

/* ========== 六、编辑模式：根据 id 回填表单 ========== */
if (editId) {
    const card = allData.find(c => c.id === Number(editId));
    if (card) {
        document.getElementById('pageTitle').innerHTML =
            '编辑月卡<span id="size"> ——修改车辆与缴费信息</span>';
        form.ownerName.value = card.ownerName;
        form.phone.value = card.phone;
        form.plateNo.value = card.plateNo;
        form.cardType.value = card.cardType;
        form.startDate.value = card.startDate;
        form.endDate.value = card.endDate;
        form.payAmount.value = card.payAmount;
        form.payType.value = card.payType;
        fillAuto();
        onCardTypeChange();   // 显示计费规则提示
    }
}

/* ========== 七、保存：校验 -> 组装 -> 持久化 -> 跳回列表 ========== */
document.getElementById('btnSave').addEventListener('click', () => {
    const card = {
        ownerName: form.ownerName.value.trim(),
        phone: form.phone.value.trim(),
        plateNo: form.plateNo.value.trim().toUpperCase(),
        cardType: form.cardType.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        payAmount: form.payAmount.value,
        payType: form.payType.value
    };

    // 表单校验
    const err = validateCard(card);
    if (err) { formTip.textContent = '⚠ ' + err; return; }
    formTip.textContent = '';

    card.payAmount = Number(card.payAmount);
    normalize(card);

    if (editId) {
        card.id = Number(editId);
        const idx = allData.findIndex(c => c.id === card.id);
        if (idx > -1) allData[idx] = card;
    } else {
        card.id = Date.now();
        allData.push(card);
    }

    saveData(allData);
    alert('保存成功！');
    location.href = 'monthCard.html';
});

/* ========== 八、重置 ========== */
document.getElementById('btnReset').addEventListener('click', () => {
    form.reset();
    formTip.textContent = '';
    form.remainDay.value = '';
    form.statusText.value = '';
    document.getElementById('billingHint').textContent = '';
    // 车主模式重新预填注册信息
    if (isUser() && !editId) {
        const s = getSession();
        form.ownerName.value = s.username;
        form.phone.value = s.phone;
        if (s.plateNo) form.plateNo.value = s.plateNo;
    }
});

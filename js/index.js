/* ============================================================
   index.js —— 工作台首页
   进入页面必须先登录，未登录自动跳转登录页。
   根据登录身份显示不同内容：
     管理员 -> 4 项统计 + 管理快捷入口
     车主   -> 我的月卡 + 购买月卡 / 续费入口（隐藏园区营收数据）
   ============================================================ */

// 登录拦截：未登录直接跳转登录页
if (!isLoggedIn()) {
    location.href = 'login.html';
}

// 统计卡片渲染：月卡车辆总数从数组长度动态计算
function renderHomeStat() {
    const data = loadData();
    document.getElementById('statCard').textContent = data.length;
    document.getElementById('statMoney').textContent = '￥' + formatMoney(286450);
    document.getElementById('statCompany').textContent = 36;
    document.getElementById('statPole').textContent = 128;
}

// 快捷入口：根据权限渲染不同入口
function renderQuickEntry() {
    const box = document.getElementById('quickRow');
    if (isAdmin()) {
        // 管理员：月卡管理 + 新增月卡
        box.innerHTML = `
            <a class="quick-card" href="monthCard.html"><span class="qicon">📇</span>月卡管理</a>
            <a class="quick-card" href="addMonthCard.html"><span class="qicon">➕</span>新增月卡</a>`;
    } else if (isUser()) {
        // 车主：购买月卡 + 我的月卡
        box.innerHTML = `
            <a class="quick-card" href="addMonthCard.html"><span class="qicon">🛒</span>购买月卡</a>
            <a class="quick-card" href="monthCard.html"><span class="qicon">📇</span>我的月卡</a>`;
    }
}

// 用户门户：车主登录后展示自己的月卡列表
function renderUserPortal() {
    const portal = document.getElementById('userPortal');
    if (!isUser()) { portal.classList.add('hide'); return; }
    portal.classList.remove('hide');

    const phone = currentUserPhone();
    const myCards = loadData().filter(c => c.phone === phone);
    const list = document.getElementById('userCardList');

    if (myCards.length === 0) {
        list.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">暂无月卡，快去<a href="addMonthCard.html" style="color:#4CAF50;">购买月卡</a>吧！</p>';
        return;
    }

    // 渲染用户月卡卡片列表
    list.innerHTML = myCards.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #eee;">
            <div>
                <strong>${c.plateNo}</strong>
                <span style="color:#888;margin-left:10px;">${c.cardType}</span>
                <span style="color:#888;margin-left:10px;">${c.startDate} ~ ${c.endDate}</span>
            </div>
            <div>
                <span class="${c.status === 0 ? 'tag-ok' : 'tag-exp'}">${statusText(c.status)}</span>
                ${c.status === 0
                    ? `<a class="op-btn" href="monthCard.html" style="margin-left:12px;">去续费</a>`
                    : `<a class="op-btn" href="addMonthCard.html" style="margin-left:12px;color:#e67e22;">续办月卡</a>`}
            </div>
        </div>`).join('');
}

// 园区运营数据总览：车主登录时隐藏
function renderStatSection() {
    const section = document.getElementById('statSection');
    if (!section) return;
    // 车主不需要查看园区营收详细数据，直接隐藏
    section.classList.toggle('hide', isUser());
}

// 统一渲染入口
function renderAll() {
    renderStatSection();
    renderHomeStat();
    renderQuickEntry();
    renderUserPortal();
}

// 页面加载完成调用
document.addEventListener('DOMContentLoaded', renderAll);

// 跨标签页实时更新：其他页面修改数据后自动刷新首页
window.onDataChange = renderAll;

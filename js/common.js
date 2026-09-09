/* ============================================================
   common.js —— 全页面公共 JavaScript
   1. localStorage 存储：月卡数据 / 用户账号 / 登录会话
   2. 月卡计费规则（月卡/季卡/年卡 价格与天数）
   3. 默认模拟月卡数据（日期相对今天动态生成）
   4. 日期 / 金额 / 状态 / 表单校验等工具函数
   5. 权限判断：管理员 / 车主 / 未登录
   6. 布局注入：header（含登录状态）+ sidebar（精简菜单）
   7. 跨标签页实时更新：storage 事件监听
   ============================================================ */

/* ========== 一、存储 key 与常量 ========== */
const STORAGE_KEY  = 'monthCardData';   // 月卡数据 key（多页面共用）
const USERS_KEY    = 'parkUsers';        // 注册车主账号 key
const SESSION_KEY  = 'currentUser';     // 当前登录会话 key

// 管理员默认账号（写死，不存 localStorage）
const ADMIN_ACCOUNT = { username: 'admin', password: 'admin123' };

// 月卡计费规则：类型 -> 单价 / 有效天数 / 每天均价
const BILLING_RULES = {
    '月卡': { price: 300,  days: 30,  perDay: '约10.0元/天'  },
    '季卡': { price: 800,  days: 90,  perDay: '约8.9元/天'   },
    '年卡': { price: 2600, days: 365, perDay: '约7.1元/天'   }
};

/* ========== 二、月卡数据读写 ========== */
function loadData() {
    const str = localStorage.getItem(STORAGE_KEY);
    if (str) { try { return JSON.parse(str); } catch (e) {} }
    const data = getDefaultData();
    saveData(data);
    return data;
}
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ========== 三、用户账号读写 ========== */
function loadUsers() {
    const str = localStorage.getItem(USERS_KEY);
    if (str) { try { return JSON.parse(str); } catch (e) {} }
    return [];   // 默认无注册用户
}
function saveUsers(data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(data));
}

/* ========== 四、登录会话管理 ========== */
function getSession() {
    const str = localStorage.getItem(SESSION_KEY);
    if (str) { try { return JSON.parse(str); } catch (e) {} }
    return null;
}
function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

/* ========== 五、权限判断 ========== */
function isAdmin()     { const s = getSession(); return s && s.type === 'admin'; }
function isUser()      { const s = getSession(); return s && s.type === 'user';  }
function isLoggedIn()  { return !!getSession(); }

// 返回当前登录车主的手机号（仅车主模式有值，用于筛选"我的月卡"）
function currentUserPhone() {
    const s = getSession();
    return (s && s.type === 'user') ? s.phone : null;
}

/* ========== 六、默认模拟数据 ==========
   日期以"今天"为基准按偏移天数动态生成，
   保证任何时候打开页面都有"可用 / 已过期"的样例。 */
function dateOffset(offsetDays) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function getDefaultData() {
    // start / end 为相对今天的偏移天数
    const raw = [
        { ownerName: '张伟', phone: '13812345678', plateNo: '赣A12345', cardType: '月卡', start: -20, end: 10,  payAmount: 300,  payType: '微信支付' },
        { ownerName: '王芳', phone: '13987654321', plateNo: '赣A23456', cardType: '季卡', start: -80, end: 10,  payAmount: 800,  payType: '支付宝' },
        { ownerName: '李娜', phone: '13711112222', plateNo: '赣M55667', cardType: '年卡', start: -350, end: 15, payAmount: 2600, payType: '微信支付' },
        { ownerName: '刘洋', phone: '13622223333', plateNo: '赣AD88899', cardType: '月卡', start: -15, end: 15, payAmount: 300, payType: '现金' },
        { ownerName: '马超', phone: '17711113333', plateNo: '赣A78901', cardType: '月卡', start: -40, end: -10, payAmount: 300, payType: '微信支付' },
        { ownerName: '陈静', phone: '13555556666', plateNo: '赣A66888', cardType: '季卡', start: -100, end: -8, payAmount: 800, payType: '支付宝' },
        { ownerName: '杨光', phone: '15012341234', plateNo: '赣A99988', cardType: '月卡', start: -5,  end: 25,  payAmount: 300,  payType: '微信支付' },
        { ownerName: '赵敏', phone: '18898765432', plateNo: '赣AB6677', cardType: '年卡', start: -300, end: 65, payAmount: 2600, payType: '现金' },
        { ownerName: '孙磊', phone: '13344445555', plateNo: '赣A33221', cardType: '月卡', start: -25, end: 5,   payAmount: 300,  payType: '支付宝' },
        { ownerName: '周婷', phone: '15677778888', plateNo: '赣M12321', cardType: '季卡', start: -70, end: 20,  payAmount: 800,  payType: '微信支付' },
        { ownerName: '吴刚', phone: '17700001111', plateNo: '赣A55667', cardType: '月卡', start: -60, end: -30, payAmount: 300, payType: '现金' },
        { ownerName: '郑爽', phone: '13922223333', plateNo: '赣AD1234', cardType: '年卡', start: -200, end: 165, payAmount: 2600, payType: '支付宝' }
    ];
    return raw.map((r, i) => normalize({
        id: i + 1, ownerName: r.ownerName, phone: r.phone, plateNo: r.plateNo,
        cardType: r.cardType, startDate: dateOffset(r.start), endDate: dateOffset(r.end),
        payAmount: r.payAmount, payType: r.payType
    }));
}

/* ========== 七、工具函数 ========== */
// 计算剩余有效天数：结束日期 - 今天（过期返回 0）
function calcRemainDay(endDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate + 'T00:00:00');
    const diff = Math.round((end - today) / 86400000);
    return diff > 0 ? diff : 0;
}
// 计算月卡状态：结束日期 >= 今天 -> 0(可用)，否则 -> 1(已过期)
function calcStatus(endDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate + 'T00:00:00');
    return end >= today ? 0 : 1;
}
// 补全剩余天数、状态两个派生字段
function normalize(card) {
    card.remainDay = calcRemainDay(card.endDate);
    card.status = calcStatus(card.endDate);
    return card;
}
// 状态码转文字
function statusText(status) { return status === 0 ? '可用' : '已过期'; }
// 金额千分位格式化
function formatMoney(n) {
    return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// 日期加天数，返回 yyyy-MM-dd
function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

/* ========== 八、月卡表单校验 ==========
   返回空字符串表示通过，否则返回错误提示文字 */
function validateCard(c) {
    if (!c.ownerName.trim()) return '请输入车主姓名';
    if (!/^1[3-9]\d{9}$/.test(c.phone)) return '请输入正确的 11 位手机号';
    const plateReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/;
    if (!plateReg.test(c.plateNo.toUpperCase())) return '请输入正确的国内车牌号，如：赣A12345';
    if (!c.cardType) return '请选择月卡类型';
    if (!c.startDate || !c.endDate) return '请选择开始日期和结束日期';
    if (c.endDate < c.startDate) return '结束日期不能早于开始日期';
    if (!(Number(c.payAmount) > 0)) return '缴费金额必须为正数';
    if (!c.payType) return '请选择支付方式';
    return '';
}

/* ========== 九、布局注入（header + sidebar） ==========
   每个页面只需放空的 <header id="header"> 和 <aside id="sidebar">，
   common.js 统一注入内容，减少 HTML 重复。 */
function renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const s = getSession();
    let html = '<span class="title">🅿️ 园区后台管理系统</span>';
    if (s) {
        const label = s.type === 'admin' ? '管理员' : '车主';
        html += `<span class="admin">👤 ${label}：${s.username}
                 <button type="button" class="btn-logout" id="btnLogout">退出登录</button></span>`;
    } else {
        html += '<span class="admin"><a href="login.html" class="btn-login">🔐 点击登录</a></span>';
    }
    header.innerHTML = html;
    // 绑定退出登录
    const btn = document.getElementById('btnLogout');
    if (btn) btn.addEventListener('click', () => { clearSession(); location.href = 'index.html'; });
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const page = location.pathname.split('/').pop().toLowerCase();
    const active = href => page === href.toLowerCase() ? 'active' : '';
    sidebar.innerHTML = `
        <ul class="menu">
            <li><a href="index.html" class="${active('index.html')}"><span>📊</span>工作台</a></li>
            <li><a href="monthCard.html" class="${active('monthcard.html')}"><span>📇</span>月卡管理</a></li>
            <li class="menu-group">
                <div class="menu-title"><span>⚙️</span>系统管理<span class="arrow">⌄</span></div>
                <ul class="sub-menu">
                    <li><a href="login.html" class="${active('login.html')}"><span>🔐</span>登录/注册</a></li>
                </ul>
            </li>
        </ul>`;
    // 自动展开包含当前页的分组
    const cur = sidebar.querySelector('a.active');
    if (cur) { const g = cur.closest('.menu-group'); if (g) g.classList.add('open'); }
    // 分组标题点击折叠/展开
    sidebar.querySelectorAll('.menu-title').forEach(t => {
        t.addEventListener('click', () => t.parentElement.classList.toggle('open'));
    });
}

// 页面加载时注入 header + sidebar
document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
});

/* ========== 十、跨标签页实时更新 ==========
   当另一个标签页修改了 localStorage 中的月卡数据，
   当前标签页通过 storage 事件自动重新渲染。 */
window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY || e.key === SESSION_KEY) {
        // 各页面可定义 onDataChange 回调，common.js 统一触发
        if (typeof window.onDataChange === 'function') window.onDataChange();
    }
});

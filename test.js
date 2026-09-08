/* ==========================================================
   test.js  公共 JS 文件（三个页面共用）
   1. localStorage 数据读取 / 保存（存储 key：monthCardData）
   2. 默认模拟月卡数据
   3. 剩余天数、状态、金额格式化等公共函数
   4. 侧边栏菜单折叠、高亮交互
   ========================================================== */

/* localStorage 存储的 key，多页面共用同一份数据 */
var STORAGE_KEY = 'monthCardData';

/* ---------- 工具函数：日期转成 yyyy-MM-dd 字符串 ---------- */
function fmtDate(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
}

/* 取“今天往前/往后 offset 天”的日期字符串，offset 为负数表示过去 */
function dateByOffset(offset) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return fmtDate(d);
}

/* ---------- 默认模拟月卡数据（本地没有数据时加载） ---------- */
function getDefaultData() {
    var list = [
        { ownerName: '张伟', phone: '13812345678', plateNo: '赣A12345', cardType: '月卡', startDate: dateByOffset(-20), endDate: dateByOffset(10),  payAmount: 300,  payType: '微信支付' },
        { ownerName: '王芳', phone: '13987654321', plateNo: '赣A23456', cardType: '季卡', startDate: dateByOffset(-80), endDate: dateByOffset(10),  payAmount: 800,  payType: '支付宝' },
        { ownerName: '李娜', phone: '13711112222', plateNo: '赣M55667', cardType: '年卡', startDate: dateByOffset(-350), endDate: dateByOffset(15), payAmount: 2600, payType: '微信支付' },
        { ownerName: '刘洋', phone: '13622223333', plateNo: '赣AD88899', cardType: '月卡', startDate: dateByOffset(-15), endDate: dateByOffset(15), payAmount: 300,  payType: '现金' },
        { ownerName: '陈静', phone: '13533334444', plateNo: '赣A34567', cardType: '月卡', startDate: dateByOffset(-25), endDate: dateByOffset(5),  payAmount: 300,  payType: '支付宝' },
        { ownerName: '杨磊', phone: '15844445555', plateNo: '赣M66D88', cardType: '季卡', startDate: dateByOffset(-60), endDate: dateByOffset(30), payAmount: 800,  payType: '微信支付' },
        { ownerName: '赵敏', phone: '15955556666', plateNo: '赣A45678', cardType: '月卡', startDate: dateByOffset(-10), endDate: dateByOffset(20), payAmount: 300,  payType: '现金' },
        { ownerName: '黄强', phone: '13766667777', plateNo: '赣AE66688', cardType: '年卡', startDate: dateByOffset(-300), endDate: dateByOffset(65), payAmount: 2600, payType: '支付宝' },
        { ownerName: '周婷', phone: '18877778888', plateNo: '赣A56789', cardType: '月卡', startDate: dateByOffset(-28), endDate: dateByOffset(120), payAmount: 300, payType: '微信支付' },
        { ownerName: '吴昊', phone: '13388889999', plateNo: '赣M77889', cardType: '季卡', startDate: dateByOffset(-70), endDate: dateByOffset(200), payAmount: 800, payType: '微信支付' },
        { ownerName: '徐丽', phone: '15599990000', plateNo: '赣AF12345', cardType: '年卡', startDate: dateByOffset(-100), endDate: dateByOffset(265), payAmount: 2600, payType: '支付宝' },
        { ownerName: '孙鹏', phone: '18600001111', plateNo: '赣A67890', cardType: '月卡', startDate: dateByOffset(-20), endDate: dateByOffset(340), payAmount: 300, payType: '现金' },
        { ownerName: '马超', phone: '17711113333', plateNo: '赣A78901', cardType: '月卡', startDate: dateByOffset(-40), endDate: dateByOffset(-10), payAmount: 300, payType: '微信支付' },
        { ownerName: '朱琳', phone: '18822224444', plateNo: '赣M99001', cardType: '季卡', startDate: dateByOffset(-100), endDate: dateByOffset(-8), payAmount: 800, payType: '支付宝' },
        { ownerName: '胡军', phone: '13933335555', plateNo: '赣AG67890', cardType: '年卡', startDate: dateByOffset(-400), endDate: dateByOffset(-35), payAmount: 2600, payType: '微信支付' },
        { ownerName: '郭涛', phone: '15844446666', plateNo: '赣A89012', cardType: '月卡', startDate: dateByOffset(-35), endDate: dateByOffset(-3), payAmount: 300, payType: '现金' }
    ];
    /* 自动计算剩余天数和状态，补齐每条数据的字段 */
    for (var i = 0; i < list.length; i++) {
        list[i].id = 1001 + i;
        list[i].remainDay = calcRemainDay(list[i].endDate);
        list[i].status = calcStatus(list[i].endDate);
    }
    return list;
}

/* ---------- 读取月卡数据：本地没有就初始化默认数据 ---------- */
function getMonthCards() {
    var str = localStorage.getItem(STORAGE_KEY);
    if (!str) {
        var data = getDefaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
    }
    return JSON.parse(str);
}

/* ---------- 保存月卡数据到 localStorage（序列化） ---------- */
function saveMonthCards(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- 计算剩余有效天数：结束日期 - 今天 ---------- */
function calcRemainDay(endDate) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    var diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/* ---------- 计算月卡状态：0 可用，1 已过期 ---------- */
function calcStatus(endDate) {
    return calcRemainDay(endDate) < 0 ? 1 : 0;
}

/* ---------- 金额千分位格式化：286450 -> 286,450.00 ---------- */
function formatMoney(num) {
    return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- 手机号正则校验 ---------- */
function checkPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}

/* ---------- 国内车牌号正则校验（含新能源车牌） ---------- */
function checkPlate(plate) {
    return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/.test(plate);
}

/* ==========================================================
   公共布局交互：侧边栏折叠 + 菜单高亮 + 菜单跳转
   ========================================================== */
function initLayout() {
    /* 顶部 ☰ 按钮：控制侧边栏折叠/展开 */
    var toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.onclick = function () {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        };
    }
    /* 菜单点击：有跳转地址的页面进行跳转，没有的只做高亮 */
    var lis = document.querySelectorAll('.sidebar li');
    for (var i = 0; i < lis.length; i++) {
        lis[i].onclick = function () {
            var page = this.getAttribute('data-page');
            if (page) {
                location.href = page;
            } else {
                /* 去掉其他高亮，给当前菜单高亮 */
                for (var j = 0; j < lis.length; j++) {
                    lis[j].classList.remove('active');
                }
                this.classList.add('active');
            }
        };
    }
}

/* ============================================================
   login.js —— 登录/注册页
   三种模式：管理员登录 / 车主登录 / 车主注册
   登录成功后写入 localStorage 会话，跳转回首页
   ============================================================ */

/* ---------- 标签切换 ---------- */
function switchTab(tabName) {
    // 切换标签高亮
    document.querySelectorAll('.login-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabName));
    // 切换面板显示
    document.querySelectorAll('.login-panel').forEach(p =>
        p.classList.toggle('hide', p.id !== tabName));
    // 清空提示
    document.querySelectorAll('.login-tip').forEach(t => t.textContent = '');
}

// 标签点击 & "点此注册/登录"链接
document.querySelectorAll('.login-tab, .login-switch a').forEach(el => {
    el.addEventListener('click', () => switchTab(el.dataset.tab));
});

/* ---------- 管理员登录 ---------- */
document.getElementById('btnAdminLogin').addEventListener('click', () => {
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPwd').value;
    const tip = document.getElementById('adminTip');

    if (!username || !password) { tip.textContent = '请输入用户名和密码'; return; }
    if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
        setSession({ type: 'admin', username: username });
        alert('管理员登录成功！');
        location.href = 'index.html';
    } else {
        tip.textContent = '用户名或密码错误';
    }
});

/* ---------- 车主登录 ---------- */
document.getElementById('btnUserLogin').addEventListener('click', () => {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPwd').value;
    const tip = document.getElementById('userLoginTip');

    if (!phone || !password) { tip.textContent = '请输入手机号和密码'; return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { tip.textContent = '手机号格式不正确'; return; }

    const users = loadUsers();
    const user = users.find(u => u.phone === phone && u.password === password);
    if (user) {
        setSession({ type: 'user', id: user.id, username: user.username, phone: user.phone, plateNo: user.plateNo });
        alert('车主登录成功！');
        location.href = 'index.html';
    } else {
        tip.textContent = '手机号或密码错误，或尚未注册';
    }
});

/* ---------- 车主注册 ---------- */
document.getElementById('btnRegister').addEventListener('click', () => {
    const username = document.getElementById('regName').value.trim();
    const phone    = document.getElementById('regPhone').value.trim();
    const plateNo  = document.getElementById('regPlate').value.trim().toUpperCase();
    const pwd      = document.getElementById('regPwd').value;
    const pwd2     = document.getElementById('regPwd2').value;
    const tip      = document.getElementById('regTip');

    // 表单校验
    if (!username) { tip.textContent = '请输入用户名'; return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { tip.textContent = '请输入正确的 11 位手机号'; return; }
    const plateReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/;
    if (!plateReg.test(plateNo)) { tip.textContent = '请输入正确的国内车牌号，如：赣A12345'; return; }
    if (pwd.length < 6) { tip.textContent = '密码至少 6 位'; return; }
    if (pwd !== pwd2) { tip.textContent = '两次密码不一致'; return; }

    // 检查手机号是否已注册
    const users = loadUsers();
    if (users.some(u => u.phone === phone)) {
        tip.textContent = '该手机号已注册，请直接登录';
        return;
    }

    // 写入用户数据
    users.push({ id: Date.now(), username, phone, plateNo, password: pwd });
    saveUsers(users);
    alert('注册成功！请登录');
    switchTab('userLogin');
    // 自动填充手机号方便登录
    document.getElementById('loginPhone').value = phone;
});

/* ---------- 如果已登录则直接跳转首页 ---------- */
if (isLoggedIn()) location.href = 'index.html';

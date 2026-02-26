const supabaseClientUrl = "https://zmccbsuzedcctggzcali.supabase.co";
const supabaseClientKey = "sb_publishable_MBjdqckQ7wtM1_YdjMiACw_8N07Fmer";
const supabaseClient = window.supabase.createClient(supabaseClientUrl, supabaseClientKey);

let trackingInterval = null;

// SESSION PROTECTION
if (window.location.pathname.includes("dashboard.html")) {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "index.html";
    } else {
        loadContacts();
        loadLocationHistory();
    }
}

// REGISTER
async function registerUser() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.from("users").insert([{ name, email, password }]);

    if (error) alert("Registration Failed");
    else {
        alert("Registration Successful");
        window.location.href = "index.html";
    }
}

// LOGIN
async function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password);

    if (data.length > 0) {
        localStorage.setItem("userEmail", email);
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid Credentials");
    }
}

// ADD CONTACT
async function addContact() {
    const userEmail = localStorage.getItem("userEmail");

    await supabaseClient.from("emergency_contacts").insert([{
        user_email: userEmail,
        contact_name: contactName.value,
        contact_phone: contactPhone.value
    }]);

    loadContacts();
    alert("Contact Added");
}

// LOAD CONTACTS
async function loadContacts() {
    const userEmail = localStorage.getItem("userEmail");

    const { data } = await supabaseClient
        .from("emergency_contacts")
        .select("*")
        .eq("user_email", userEmail);

    const list = document.getElementById("contactList");
    list.innerHTML = "";

    data.forEach(contact => {
        const li = document.createElement("li");
        li.innerText = contact.contact_name + " - " + contact.contact_phone;
        list.appendChild(li);
    });
}

// SEND LOCATION
async function sendLocation() {
    if (!navigator.geolocation) return alert("Not Supported");

    navigator.geolocation.getCurrentPosition(async function(position) {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const userEmail = localStorage.getItem("userEmail");

        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        await supabaseClient.from("user_locations")
            .insert([{ user_email: userEmail, latitude, longitude }]);

        const { data: contacts } = await supabaseClient
            .from("emergency_contacts")
            .select("*")
            .eq("user_email", userEmail);

        contacts.forEach(contact => {
            const message = `🚨 EMERGENCY! My location: ${mapsLink}`;
            window.open(`sms:${contact.contact_phone}?body=${encodeURIComponent(message)}`);
        });

        loadLocationHistory();
        alert("Location Sent!");
    });
}

// SOS ALERT
function sosAlert() {
    document.body.style.background = "red";
    sendLocation();
    setTimeout(() => {
        document.body.style.background = "linear-gradient(to right, #ff416c, #ff4b2b)";
    }, 3000);
}

// LIVE TRACKING
function startLiveTracking() {
    if (trackingInterval) return;

    trackingInterval = setInterval(() => {
        sendLocation();
    }, 30000);

    alert("Live Tracking Started");
}

function stopLiveTracking() {
    clearInterval(trackingInterval);
    trackingInterval = null;
    alert("Live Tracking Stopped");
}

// LOCATION HISTORY
async function loadLocationHistory() {
    const userEmail = localStorage.getItem("userEmail");

    const { data } = await supabaseClient
        .from("user_locations")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(5);

    const list = document.getElementById("locationHistory");
    list.innerHTML = "";

    data.forEach(loc => {
        const li = document.createElement("li");
        li.innerText = `Lat: ${loc.latitude}, Lng: ${loc.longitude}`;
        list.appendChild(li);
    });
}

// LOGOUT
function logout() {
    stopLiveTracking();
    localStorage.removeItem("userEmail");
    window.location.href = "index.html";
}


// 🔴 ADD YOUR supabaseClient DETAILS HERE
// 🔴 ADD YOUR supabaseClient DETAILS HERE
const supabaseClientUrl = "https://zmccbsuzedcctggzcali.supabase.co";
const supabaseClientKey = "sb_publishable_MBjdqckQ7wtM1_YdjMiACw_8N07Fmer";
const supabaseClient = window.supabase.createClient(supabaseClientUrl, supabaseClientKey);

// REGISTER FUNCTION
async function registerUser() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient
        .from("users")
        .insert([{ name, email, password }]);

    if (error) {
        alert("Registration Failed");
    } else {
        alert("Registration Successful");
        window.location.href = "index.html";
    }
}

// LOGIN FUNCTION
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
        alert("Login Successful");
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid Email or Password");
    }
}

// ADD EMERGENCY CONTACT
async function addContact() {
    const userEmail = localStorage.getItem("userEmail");
    const contactName = document.getElementById("contactName").value;
    const contactPhone = document.getElementById("contactPhone").value;

    await supabaseClient
        .from("emergency_contacts")
        .insert([{ user_email: userEmail, contact_name: contactName, contact_phone: contactPhone }]);

    alert("Emergency Contact Added");
}

// 🚨 SEND LOCATION TO ALL EMERGENCY CONTACTS
async function sendLocation() {

    const userEmail = localStorage.getItem("userEmail");

    if (!navigator.geolocation) {
        alert("Geolocation Not Supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async function(position) {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        // Save location in database
        await supabaseClient
            .from("user_locations")
            .insert([{ user_email: userEmail, latitude, longitude }]);

        // Fetch emergency contacts
        const { data: contacts } = await supabaseClient
            .from("emergency_contacts")
            .select("*")
            .eq("user_email", userEmail);

        if (!contacts || contacts.length === 0) {
            alert("No Emergency Contacts Found");
            return;
        }

        // Send SMS to each contact
        contacts.forEach(contact => {

            const message = `🚨 EMERGENCY ALERT!\nI need help. My current location:\n${googleMapsLink}`;
            const smsLink = `sms:${contact.contact_phone}?body=${encodeURIComponent(message)}`;

            window.open(smsLink, "_blank");

        });

        alert("Location Sent to All Emergency Contacts");

    });
}

// LOGOUT
function logout() {
    localStorage.removeItem("userEmail");
    window.location.href = "index.html";
}

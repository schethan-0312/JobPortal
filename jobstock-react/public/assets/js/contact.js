//=========================================//
/*/*            Contact Form               */
//=========================================//
document.addEventListener("DOMContentLoaded", () => {
    const form = document.forms["myForm"];
    const errorMsg = document.getElementById("error-msg");
    const responseMsg = document.getElementById("simple-msg");

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        errorMsg.style.opacity = 0;
        errorMsg.innerHTML = "";

        const name = form["name"].value.trim();
        const email = form["email"].value.trim();
        const subject = form["subject"].value.trim();
        const number = form["number"].value.trim();
        const Message = form["Message"].value.trim();

        const showError = (message) => {
            errorMsg.innerHTML = `<div class="alert alert-warning error_message">${message}</div>`;
            fadeIn(errorMsg);
        };

        if (!name) return showError("*Please enter a Name*");
        if (!email) return showError("*Please enter an Email*");
        if (!subject) return showError("*Please enter a Subject*");
        if (!number) return showError("*Please enter a Number*");
        if (!Message) return showError("*Please enter Message*");

        const csrfToken = document.querySelector('meta[name="csrfToken"]')?.getAttribute('content');
        const formData = new URLSearchParams({
            name, email, subject, number, Message
        });

        try {
            const response = await fetch("/contact/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRF-Token": csrfToken || ""
                },
                body: formData
            });

            const result = await response.json();

            if (result.status === "success") {
                responseMsg.innerHTML = `<div id="success_page" class="alert alert-success">${result.message}</div>`;
                form.reset();
            } else {
                errorMsg.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                fadeIn(errorMsg);
            }
        } catch (err) {
            console.error("Error in form submission:", err);
            errorMsg.innerHTML = `<div class="alert alert-danger">Unexpected error occurred.</div>`;
            fadeIn(errorMsg);
        }
    });

    function fadeIn(element) {
        element.style.opacity = 0;
        element.style.display = "block";

        let opacity = 0;
        const interval = setInterval(() => {
            opacity += 0.1;
            element.style.opacity = opacity;
            if (opacity >= 1) clearInterval(interval);
        }, 50);
    }
});
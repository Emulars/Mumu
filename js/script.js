document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const bookContainer = document.getElementById('book-container');
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password-input');
    const errorMsg = document.getElementById('error-msg');
    const book = document.getElementById('book');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Default demo content to use if encryption fails (for testing/demo only)
    // In production, you would remove this fallback or keep it empty.
    const demoContent = [
        {
            type: "cover",
            title: "Our Love Story",
            text: "A journey of a thousand miles begins with a single step..."
        },
        {
            type: "page",
            title: "The Beginning",
            text: "Do you remember the first time we met? The world stopped for a moment.",
            image: "https://via.placeholder.com/300x200/ffcdd2/880e4f?text=First+Meeting"
        },
        {
            type: "page",
            title: "Our First Date",
            text: "The coffee was hot, but your smile was warmer.",
            image: "https://via.placeholder.com/300x200/f8bbd0/880e4f?text=Coffee+Date"
        },
        {
            type: "page",
            title: "Adventures",
            text: "Every trip with you is a new favorite memory.",
            image: "https://via.placeholder.com/300x200/e1bee7/4a148c?text=Adventure"
        },
        {
            type: "page",
            title: "Forever",
            text: "I can't wait to see what the future holds for us. I love you.",
            image: "https://via.placeholder.com/300x200/d1c4e9/311b92?text=Forever"
        }
    ];

    let currentPage = 0;
    let totalPages = 0;

    // Check if we are in setup mode (placeholder content)
    if (typeof encryptedStory === 'undefined' || encryptedStory.length < 60) {
        console.log("Demo mode active. Password is 'demo'.");
        const p = document.createElement('p');
        p.style.fontSize = '0.8rem';
        p.style.color = '#666';
        p.innerHTML = "First time? Use password: <b>demo</b><br>Then run setup.html to create your own!";
        document.querySelector('.login-container').appendChild(p);
    }

    loginBtn.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    function attemptLogin() {
        const password = passwordInput.value;
        errorMsg.classList.add('hidden');

        if (!password) return;

        try {
            let decryptedData;
            
            // Check if encryptedStory is defined and looks like a real encrypted string
            if (typeof encryptedStory !== 'undefined' && encryptedStory.length > 50) {
                const bytes = CryptoJS.AES.decrypt(encryptedStory, password);
                const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
                
                if (decryptedString) {
                    decryptedData = JSON.parse(decryptedString);
                } else {
                    throw new Error("Decryption failed");
                }
            } else {
                // Fallback for demo purposes if no encrypted content is set up
                if (password === "demo") {
                    decryptedData = demoContent;
                    alert("Using demo content. Please run setup.html to generate your own encrypted story!");
                } else {
                    throw new Error("No content available");
                }
            }

            // If we got here, we have data
            initBook(decryptedData);
            loginScreen.style.opacity = 0;
            setTimeout(() => {
                loginScreen.classList.add('hidden');
                bookContainer.classList.remove('hidden');
            }, 500);

        } catch (e) {
            console.error(e);
            errorMsg.textContent = "Wrong password or corrupted data.";
            errorMsg.classList.remove('hidden');
            passwordInput.value = '';
        }
    }

    function initBook(data) {
        book.innerHTML = '';
        // Ensure we have even number of pages for the book structure (front/back)
        // Actually, each "sheet" has a front and back.
        // The data array represents "faces". 
        // Sheet 1: Front (Cover), Back (Page 1)
        // Sheet 2: Front (Page 2), Back (Page 3)
        // ...
        
        // Let's reorganize data into sheets.
        // If data has N items.
        // Item 0 is Cover Front.
        // Item 1 is Cover Back (usually empty or dedication).
        // Item 2 is Page 1 Front.
        // Item 3 is Page 1 Back.
        
        // To make it simple, let's treat each item in data as a "Face".
        // We need to pair them up into Sheets.
        
        const pages = [];
        // Add a blank end page if odd number of faces
        if (data.length % 2 !== 0) {
            data.push({ type: "blank", text: "" });
        }

        for (let i = 0; i < data.length; i += 2) {
            const sheet = document.createElement('div');
            sheet.classList.add('page');
            sheet.style.zIndex = data.length - i; // Stack order
            
            const frontData = data[i];
            const backData = data[i+1];

            const frontFace = createFace(frontData, 'front');
            const backFace = createFace(backData, 'back');

            sheet.appendChild(frontFace);
            sheet.appendChild(backFace);
            
            // Click to flip
            sheet.addEventListener('click', () => {
                if (sheet.classList.contains('flipped')) {
                    // Flip back (only if it's the top of the left stack)
                    // We handle z-index dynamically or just rely on order
                    sheet.classList.remove('flipped');
                    sheet.style.zIndex = data.length - i;
                } else {
                    // Flip forward
                    sheet.classList.add('flipped');
                    sheet.style.zIndex = i + 1; // Move to top of left stack (simplified)
                }
            });

            book.appendChild(sheet);
            pages.push(sheet);
        }
        
        totalPages = pages.length;
    }

    function createFace(data, side) {
        const div = document.createElement('div');
        div.classList.add(side);
        
        if (data.type === 'cover') {
            const h2 = document.createElement('h2');
            h2.textContent = data.title;
            div.appendChild(h2);
            if (data.text) {
                const p = document.createElement('p');
                p.textContent = data.text;
                div.appendChild(p);
            }
        } else if (data.type === 'page') {
            if (data.title) {
                const h2 = document.createElement('h2');
                h2.textContent = data.title;
                div.appendChild(h2);
            }
            if (data.image) {
                const img = document.createElement('img');
                img.src = data.image;
                div.appendChild(img);
            }
            if (data.text) {
                const p = document.createElement('p');
                p.textContent = data.text;
                div.appendChild(p);
            }
        } else {
            // Blank or other
        }
        
        return div;
    }

    // Navigation buttons
    prevBtn.addEventListener('click', () => {
        // Find last flipped page and unflip it
        const flipped = document.querySelectorAll('.page.flipped');
        if (flipped.length > 0) {
            const lastFlipped = flipped[flipped.length - 1];
            lastFlipped.click();
        }
    });

    nextBtn.addEventListener('click', () => {
        // Find first unflipped page and flip it
        const pages = document.querySelectorAll('.page');
        for (let p of pages) {
            if (!p.classList.contains('flipped')) {
                p.click();
                break;
            }
        }
    });
});

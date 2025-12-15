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
        const pages = [];
        
        // Add Back Cover
        // We ensure the last face is the back cover (Back side of the last sheet)
        if (data.length % 2 === 0) {
            // Even number of faces. Next is Front.
            // Add a blank "End Paper" for the inside of the back cover
            data.push({ type: "page", text: "The End", isEndPaper: true });
        }
        // Now length is odd. Next is Back.
        data.push({ type: "back-cover" });

        // Create sheets
        for (let i = 0; i < data.length; i += 2) {
            const sheet = document.createElement('div');
            sheet.classList.add('page');
            // Initial Z-Index: Higher for earlier pages
            sheet.style.zIndex = (data.length / 2) - (i / 2);
            
            const frontData = data[i];
            const backData = data[i+1];

            const frontFace = createFace(frontData, 'front');
            const backFace = createFace(backData, 'back');

            sheet.appendChild(frontFace);
            sheet.appendChild(backFace);
            
            // Click to flip
            sheet.addEventListener('click', () => {
                handlePageFlip(sheet, i, data.length);
            });

            book.appendChild(sheet);
            pages.push(sheet);
        }
        
        totalPages = pages.length;
        updateSunflower(0); // Initialize sunflower
    }

    function handlePageFlip(sheet, index, totalFaces) {
        const sheetIndex = index / 2;
        const totalSheets = totalFaces / 2;

        if (sheet.classList.contains('flipped')) {
            // Flip BACK (Left to Right)
            // Only allow flipping back if it's the top-most flipped page
            const nextSheet = sheet.nextElementSibling;
            if (nextSheet && nextSheet.classList.contains('flipped')) {
                return; 
            }

            sheet.classList.add('flipping'); 
            sheet.classList.remove('flipped');
            
            // If closing the first page, center the book back
            if (sheetIndex === 0) {
                book.classList.remove('open');
            }
            // If opening the last page (from back), shift book to center spine
            if (sheetIndex === totalSheets - 1) {
                book.classList.add('open');
                book.classList.remove('view-back');
            }

            // Update progress
            updateSunflower(sheetIndex / totalSheets);

            setTimeout(() => {
                sheet.classList.remove('flipping');
                sheet.style.zIndex = totalSheets - sheetIndex;
            }, 600); 

        } else {
            // Flip FORWARD (Right to Left)
            const prevSheet = sheet.previousElementSibling;
            if (prevSheet && !prevSheet.classList.contains('flipped')) {
                return;
            }

            sheet.classList.add('flipping');
            sheet.classList.add('flipped');
            
            // If opening the first page, shift book to center spine
            if (sheetIndex === 0) {
                book.classList.add('open');
            }
            // If closing the last page (to back), center the book back
            if (sheetIndex === totalSheets - 1) {
                book.classList.remove('open');
                book.classList.add('view-back');
            }

            // Update progress
            updateSunflower((sheetIndex + 1) / totalSheets);

            setTimeout(() => {
                sheet.classList.remove('flipping');
                sheet.style.zIndex = 100 + sheetIndex; 
            }, 600);
        }
    }

    function updateSunflower(progress) {
        // progress is 0.0 to 1.0
        
        // 1. Grass grows first (0% to 20%)
        const grass = document.getElementById('grass');
        let grassScale = 0;
        if (progress > 0) {
            grassScale = Math.min(progress * 5, 1);
        }
        grass.style.transform = `scale(1, ${grassScale})`;

        // 2. Stems grow (10% to 50%)
        const stems = document.querySelectorAll('.stem');
        let stemProgress = 0;
        if (progress > 0.1) {
            stemProgress = Math.min((progress - 0.1) * 2.5, 1);
        }
        const dashOffset = 300 - (300 * stemProgress);
        stems.forEach(stem => stem.style.strokeDashoffset = dashOffset);

        // 3. Leaves appear (30% to 70%)
        const leaves = document.querySelectorAll('.leaves');
        let leafScale = 0;
        if (progress > 0.3) {
            leafScale = Math.min((progress - 0.3) * 2.5, 1);
        }
        leaves.forEach(leaf => leaf.style.transform = `scale(${leafScale})`);

        // 4. Flower heads bloom (50% to 100%)
        // We animate center and petals separately for a "blooming" effect
        const centers = document.querySelectorAll('.flower-center');
        const petalsGroups = document.querySelectorAll('.flower-petals');
        
        let centerScale = 0;
        let petalsScale = 0;
        let rotation = 0;

        // Center grows first (50% to 80%)
        if (progress > 0.5) {
            centerScale = Math.min((progress - 0.5) * 3.33, 1);
        }

        // Petals bloom out (60% to 100%)
        if (progress > 0.6) {
            petalsScale = Math.min((progress - 0.6) * 2.5, 1);
            // Add a slight rotation as it blooms
            rotation = (progress - 0.6) * 100; // 0 to 40 degrees
        }

        centers.forEach(center => {
            center.style.transform = `scale(${centerScale})`;
        });

        petalsGroups.forEach(group => {
            group.style.transform = `scale(${petalsScale}) rotate(${rotation}deg)`;
        });
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
        } else if (data.type === 'back-cover') {
            div.classList.add('back-cover-face');
            const h2 = document.createElement('h2');
            h2.innerHTML = "Made with &hearts;";
            div.appendChild(h2);
        } else if (data.type === 'page') {
            if (data.isEndPaper) {
                div.classList.add('end-paper');
            }
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

    // Hearts Animation
    function createHeart() {
        const heartsContainer = document.getElementById('hearts-container');
        if (!heartsContainer) return;

        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '❤';
        
        // Randomize position and animation properties
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.animationDuration = Math.random() * 3 + 5 + 's'; // 5-8 seconds
        heart.style.fontSize = Math.random() * 20 + 10 + 'px'; // 10-30px
        
        heartsContainer.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            heart.remove();
        }, 8000);
    }

    // Create hearts periodically
    setInterval(createHeart, 500);
});

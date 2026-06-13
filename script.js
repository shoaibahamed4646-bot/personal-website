// script.js
// Client-side interactions & Supabase integrations for Shoaib Mahin's portfolio

// =========================================================================
// SUPABASE CONFIGURATION
// Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your credentials
// =========================================================================
const supabaseUrl = 'https://fdtvqmhnaxdhjzmflkwi.supabase.co';
const supabaseKey = 'sb_publishable_p8pRdWn2jRHCPo-Bh4gJdQ_KW6VPWm8';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabaseUrl !== 'YOUR_SUPABASE_URL') {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize viewer or admin views based on DOM elements
    if (document.getElementById('loginForm') || document.getElementById('dashboardSection')) {
        initAdminDashboard();
    } else {
        initPortfolioViewer();
    }
});

// =========================================================================
// PORTFOLIO VIEWER PAGE LOGIC (index.html)
// =========================================================================
function initPortfolioViewer() {
    // 1. Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });

        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
            });
        });
    }

    // 2. Scroll Spy - Active Navigation Link
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('nav.main-nav ul li a');

    function highlightNavigation() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPosition >= (sectionTop - 150)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSectionId}`) {
                item.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();

    // 3. Static Contact Form Submission via Web3Forms
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            formMessage.style.display = 'none';
            formMessage.className = 'form-message';
            formMessage.textContent = 'Sending message...';
            formMessage.style.display = 'block';

            const formData = new FormData(contactForm);
            const accessKey = formData.get('access_key');
            
            if (accessKey === 'YOUR_ACCESS_KEY_HERE') {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Please configure your Web3Forms Access Key in index.html!';
                return;
            }

            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let res = await response.json();
                if (response.status === 200) {
                    formMessage.className = 'form-message success';
                    formMessage.textContent = 'Thank you! Your message has been sent successfully.';
                    contactForm.reset();
                } else {
                    formMessage.className = 'form-message error';
                    formMessage.textContent = res.message || 'Something went wrong. Please try again.';
                }
            })
            .catch(error => {
                console.error(error);
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Server connection failed. Please check your internet connection.';
            });
        });
    }

    // 4. Fetch and render data from Supabase (if configured)
    if (supabaseClient) {
        loadViewerData();
    } else {
        console.log("Supabase not configured. Using pre-loaded HTML content.");
    }
}

async function loadViewerData() {
    try {
        // Fetch Profile
        const { data: profile, error: pError } = await supabaseClient
            .from('profile')
            .select('*')
            .eq('id', 1)
            .single();

        if (profile && !pError) {
            document.title = `${profile.name} | CSE Student & Developer`;
            document.querySelector('.logo').innerHTML = `${profile.name.split(' ')[0]}<span>${profile.name.split(' ').slice(1).join(' ')}</span>`;
            
            // Hero section
            document.querySelector('#home .hero-tag').textContent = profile.hero_tag || 'Welcome to my space';
            document.querySelector('#home .hero-title').innerHTML = `Hi, I'm ${profile.name}.<br>${profile.title}.`;
            document.querySelector('#home .hero-desc').textContent = profile.hero_desc;
            
            // About section
            const aboutParagraphs = document.querySelectorAll('#about .about-info p');
            if (aboutParagraphs.length >= 2) {
                aboutParagraphs[0].innerHTML = profile.about_text_1;
                aboutParagraphs[1].innerHTML = profile.about_text_2;
            }
            
            // Education Card
            const eduCard = document.querySelector('#about .education-card');
            if (eduCard) {
                eduCard.querySelector('.year').textContent = profile.education_year;
                eduCard.querySelector('h3').textContent = profile.education_degree;
                eduCard.querySelector('.inst').textContent = profile.education_inst;
                eduCard.querySelector('p:last-child').textContent = profile.education_desc;
            }

            // Contact info
            const contactItems = document.querySelectorAll('#contact .contact-item');
            if (contactItems.length >= 2) {
                contactItems[0].querySelector('p').textContent = profile.email;
                contactItems[1].querySelector('p').textContent = profile.location;
            }
        }

        // Fetch Skills
        const { data: skills, error: sError } = await supabaseClient
            .from('skills')
            .select('*');

        if (skills && !sError) {
            renderViewerSkills(skills);
        }

        // Fetch Projects
        const { data: projects, error: prError } = await supabaseClient
            .from('projects')
            .select('*')
            .order('id', { ascending: true });

        if (projects && !prError) {
            renderViewerProjects(projects);
        }

    } catch (error) {
        console.error("Error loading Supabase data:", error);
    }
}

function renderViewerSkills(skills) {
    const skillsWrapper = document.querySelector('#about .skills-grid');
    if (!skillsWrapper) return;
    skillsWrapper.innerHTML = '';

    // Group skills by category
    const categories = [...new Set(skills.map(s => s.category))];
    
    categories.forEach(category => {
        const categorySkills = skills.filter(s => s.category === category);
        const card = document.createElement('div');
        card.className = 'skill-category';
        
        let tagsHTML = '';
        categorySkills.forEach(s => {
            tagsHTML += `<span class="skill-tag">${s.name}</span>`;
        });

        card.innerHTML = `
            <h4>${category}</h4>
            <div class="skill-list">
                ${tagsHTML}
            </div>
        `;
        skillsWrapper.appendChild(card);
    });
}

function renderViewerProjects(projects) {
    const projectsGrid = document.querySelector('#projects .projects-grid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';

        let tagsHTML = '';
        project.tags.forEach(tag => {
            tagsHTML += `<span>${tag.trim()}</span>`;
        });

        card.innerHTML = `
            <div class="project-content">
                <div class="project-meta">
                    <span class="project-type">${project.type}</span>
                </div>
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-tags">
                    ${tagsHTML}
                </div>
                <div class="project-links">
                    <a href="${project.github_url}" target="_blank" rel="noopener noreferrer" class="project-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                        GitHub
                    </a>
                </div>
            </div>
        `;
        projectsGrid.appendChild(card);
    });
}

// =========================================================================
// ADMIN CONTROL PANEL LOGIC (admin.html)
// =========================================================================
let currentSession = null;

function initAdminDashboard() {
    const loginForm = document.getElementById('loginForm');
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!supabaseClient) {
        alert("Warning: Supabase credentials are not configured yet! Please update YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY inside script.js.");
        return;
    }

    // Initialize Auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        if (session) {
            // Logged in
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            logoutBtn.style.display = 'block';
            loadAdminData();
        } else {
            // Logged out
            authSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    });

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('loginMessage');

            msg.style.display = 'none';

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                msg.className = 'form-message error';
                msg.textContent = error.message;
                msg.style.display = 'block';
            } else {
                msg.className = 'form-message success';
                msg.textContent = 'Login successful!';
                msg.style.display = 'block';
            }
        });
    }

    // Handle Logout Click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
        });
    }

    // Setup Tabs switching
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    // Handle Forms Submission in Admin Dashboard
    setupAdminForms();
}

async function loadAdminData() {
    try {
        // 1. Load Profile
        const { data: profile } = await supabaseClient.from('profile').select('*').eq('id', 1).single();
        if (profile) {
            document.getElementById('prof_name').value = profile.name;
            document.getElementById('prof_title').value = profile.title;
            document.getElementById('prof_tag').value = profile.hero_tag;
            document.getElementById('prof_email').value = profile.email;
            document.getElementById('prof_hero_desc').value = profile.hero_desc;
            document.getElementById('prof_about_1').value = profile.about_text_1;
            document.getElementById('prof_about_2').value = profile.about_text_2;
            document.getElementById('prof_edu_year').value = profile.education_year;
            document.getElementById('prof_edu_degree').value = profile.education_degree;
            document.getElementById('prof_edu_inst').value = profile.education_inst;
            document.getElementById('prof_location').value = profile.location;
            document.getElementById('prof_edu_desc').value = profile.education_desc;
        }

        // 2. Load Skills List
        loadAdminSkillsList();

        // 3. Load Projects List
        loadAdminProjectsList();

    } catch (e) {
        console.error("Error loading admin data:", e);
    }
}

async function loadAdminSkillsList() {
    const { data: skills } = await supabaseClient.from('skills').select('*').order('id', { ascending: true });
    const list = document.getElementById('skillsManagerList');
    if (!list) return;
    list.innerHTML = '';

    if (skills) {
        skills.forEach(skill => {
            const row = document.createElement('div');
            row.className = 'skill-item-row';
            row.innerHTML = `
                <div>
                    <span class="skill-cat-label">${skill.category}</span>
                    <strong>${skill.name}</strong>
                </div>
                <button class="btn-delete" onclick="deleteSkill(${skill.id})">Delete</button>
            `;
            list.appendChild(row);
        });
    }
}

async function loadAdminProjectsList() {
    const { data: projects } = await supabaseClient.from('projects').select('*').order('id', { ascending: true });
    const list = document.getElementById('projectsManagerList');
    if (!list) return;
    list.innerHTML = '';

    if (projects) {
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-editor-card';
            card.innerHTML = `
                <h4>${project.title} <span style="font-size:0.8rem; font-weight:500; color:#64748b;">(${project.type})</span></h4>
                <p style="font-size:0.9rem; color:#475569; margin: 0.25rem 0;">${project.description}</p>
                <div style="font-size:0.8rem; color:#64748b;">Tags: ${project.tags.join(', ')}</div>
                <div class="project-editor-actions">
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size:0.8rem;" onclick="editProject(${JSON.stringify(project).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-delete" style="padding: 4px 8px; font-size:0.8rem;" onclick="deleteProject(${project.id})">Delete</button>
                </div>
            `;
            list.appendChild(card);
        });
    }
}

// Global functions for list buttons
window.deleteSkill = async function(id) {
    if (confirm("Are you sure you want to delete this skill?")) {
        const { error } = await supabaseClient.from('skills').delete().eq('id', id);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            loadAdminSkillsList();
        }
    }
};

window.editProject = function(project) {
    document.getElementById('projectFormTitle').textContent = 'Edit Project';
    document.getElementById('projSubmitBtn').textContent = 'Save Changes';
    document.getElementById('projCancelBtn').style.display = 'inline-block';
    
    document.getElementById('proj_id').value = project.id;
    document.getElementById('proj_title').value = project.title;
    document.getElementById('proj_type').value = project.type;
    document.getElementById('proj_tags').value = project.tags.join(', ');
    document.getElementById('proj_github').value = project.github_url;
    document.getElementById('proj_desc').value = project.description;

    document.getElementById('projectForm').scrollIntoView({ behavior: 'smooth' });
};

window.deleteProject = async function(id) {
    if (confirm("Are you sure you want to delete this project?")) {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            loadAdminProjectsList();
        }
    }
};

function setupAdminForms() {
    const profileForm = document.getElementById('profileForm');
    const addSkillForm = document.getElementById('addSkillForm');
    const projectForm = document.getElementById('projectForm');
    const projCancelBtn = document.getElementById('projCancelBtn');

    // 1. Submit Profile Form
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('profileMessage');
            msg.style.display = 'none';

            const profileData = {
                name: document.getElementById('prof_name').value,
                title: document.getElementById('prof_title').value,
                hero_tag: document.getElementById('prof_tag').value,
                email: document.getElementById('prof_email').value,
                hero_desc: document.getElementById('prof_hero_desc').value,
                about_text_1: document.getElementById('prof_about_1').value,
                about_text_2: document.getElementById('prof_about_2').value,
                education_year: document.getElementById('prof_edu_year').value,
                education_degree: document.getElementById('prof_edu_degree').value,
                education_inst: document.getElementById('prof_edu_inst').value,
                location: document.getElementById('prof_location').value,
                education_desc: document.getElementById('prof_edu_desc').value
            };

            const { error } = await supabaseClient
                .from('profile')
                .update(profileData)
                .eq('id', 1);

            if (error) {
                msg.className = 'form-message error';
                msg.textContent = error.message;
                msg.style.display = 'block';
            } else {
                msg.className = 'form-message success';
                msg.textContent = 'Profile successfully updated!';
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }
        });
    }

    // 2. Submit Add Skill Form
    if (addSkillForm) {
        addSkillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('skillsMessage');
            msg.style.display = 'none';

            const skillData = {
                category: document.getElementById('skill_cat').value,
                name: document.getElementById('skill_name').value
            };

            const { error } = await supabaseClient
                .from('skills')
                .insert([skillData]);

            if (error) {
                msg.className = 'form-message error';
                msg.textContent = error.message;
                msg.style.display = 'block';
            } else {
                document.getElementById('skill_name').value = '';
                msg.className = 'form-message success';
                msg.textContent = 'Skill added successfully!';
                msg.style.display = 'block';
                loadAdminSkillsList();
                setTimeout(() => msg.style.display = 'none', 3000);
            }
        });
    }

    // 3. Submit Add/Edit Project Form
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('projectsMessage');
            msg.style.display = 'none';

            const projId = document.getElementById('proj_id').value;
            const projectData = {
                title: document.getElementById('proj_title').value,
                type: document.getElementById('proj_type').value,
                tags: document.getElementById('proj_tags').value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                github_url: document.getElementById('proj_github').value,
                description: document.getElementById('proj_desc').value
            };

            let error = null;

            if (projId) {
                // Edit mode
                const { error: editErr } = await supabaseClient
                    .from('projects')
                    .update(projectData)
                    .eq('id', projId);
                error = editErr;
            } else {
                // Add mode
                const { error: addErr } = await supabaseClient
                    .from('projects')
                    .insert([projectData]);
                error = addErr;
            }

            if (error) {
                msg.className = 'form-message error';
                msg.textContent = error.message;
                msg.style.display = 'block';
            } else {
                resetProjectForm();
                msg.className = 'form-message success';
                msg.textContent = projId ? 'Project updated successfully!' : 'Project added successfully!';
                msg.style.display = 'block';
                loadAdminProjectsList();
                setTimeout(() => msg.style.display = 'none', 3000);
            }
        });
    }

    // Cancel edit click
    if (projCancelBtn) {
        projCancelBtn.addEventListener('click', resetProjectForm);
    }
}

function resetProjectForm() {
    document.getElementById('projectFormTitle').textContent = 'Add New Project';
    document.getElementById('projSubmitBtn').textContent = 'Add Project';
    document.getElementById('projCancelBtn').style.display = 'none';
    
    document.getElementById('proj_id').value = '';
    document.getElementById('proj_title').value = '';
    document.getElementById('proj_type').value = '';
    document.getElementById('proj_tags').value = '';
    document.getElementById('proj_github').value = '';
    document.getElementById('proj_desc').value = '';
}

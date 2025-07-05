// DOM Elements
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const shortenForm = document.getElementById('shortenForm');
const shortenResult = document.getElementById('shortenResult');
const copyBtn = document.getElementById('copyBtn');
const linksTableBody = document.getElementById('linksTableBody');

// Sample data
let linksData = [
    {
        id: 1,
        shortUrl: 'bit.ly/abc123',
        originalUrl: 'https://example.com/very-long-url-that-needs-shortening',
        clicks: 47,
        created: '2025-07-03',
        status: 'active',
        description: 'Marketing campaign link'
    },
    {
        id: 2,
        shortUrl: 'bit.ly/xyz789',
        originalUrl: 'https://another-example.com/page-with-content',
        clicks: 23,
        created: '2025-07-02',
        status: 'active',
        description: 'Product launch page'
    },
    {
        id: 3,
        shortUrl: 'bit.ly/def456',
        originalUrl: 'https://sample-site.com/article/important-news',
        clicks: 12,
        created: '2025-07-01',
        status: 'expired',
        description: 'News article'
    },
    {
        id: 4,
        shortUrl: 'bit.ly/ghi789',
        originalUrl: 'https://blog.example.com/how-to-guide',
        clicks: 89,
        created: '2025-06-30',
        status: 'active',
        description: 'Tutorial guide'
    },
    {
        id: 5,
        shortUrl: 'bit.ly/jkl012',
        originalUrl: 'https://store.example.com/special-offer',
        clicks: 156,
        created: '2025-06-28',
        status: 'active',
        description: 'Special promotion'
    }
];

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('show');
    });

    // Close sidebar
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('show');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Navigation link handling
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetSection = link.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }
        });
    });
}

// URL Shortening functionality
function initializeShortenForm() {
    shortenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const originalUrl = document.getElementById('originalUrl').value;
        const customAlias = document.getElementById('customAlias').value;
        const description = document.getElementById('description').value;
        
        // Simulate URL shortening
        const shortUrl = customAlias ? `bit.ly/${customAlias}` : `bit.ly/${generateRandomString(6)}`;
        
        // Add to links data
        const newLink = {
            id: linksData.length + 1,
            shortUrl: shortUrl,
            originalUrl: originalUrl,
            clicks: 0,
            created: new Date().toISOString().split('T')[0],
            status: 'active',
            description: description || 'No description'
        };
        
        linksData.unshift(newLink);
        
        // Show result
        document.getElementById('shortUrl').value = `https://${shortUrl}`;
        shortenResult.style.display = 'block';
        shortenResult.scrollIntoView({ behavior: 'smooth' });
        
        // Update links table
        updateLinksTable();
        
        // Reset form
        shortenForm.reset();
    });
    
    // Copy functionality
    copyBtn.addEventListener('click', () => {
        const shortUrlInput = document.getElementById('shortUrl');
        shortUrlInput.select();
        document.execCommand('copy');
        
        // Show feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Generate random string for short URLs
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Links table functionality
function updateLinksTable() {
    linksTableBody.innerHTML = '';
    
    linksData.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="short-url">${link.shortUrl}</span>
            </td>
            <td>
                <span class="original-url" title="${link.originalUrl}">
                    ${link.originalUrl.length > 50 ? link.originalUrl.substring(0, 50) + '...' : link.originalUrl}
                </span>
            </td>
            <td>${link.clicks}</td>
            <td>${formatDate(link.created)}</td>
            <td>
                <span class="status-badge ${link.status === 'active' ? 'status-active' : 'status-expired'}">
                    ${link.status}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="editLink(${link.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteLink(${link.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn" onclick="copyLink('${link.shortUrl}')" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        `;
        linksTableBody.appendChild(row);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Link actions
function editLink(id) {
    const link = linksData.find(l => l.id === id);
    if (link) {
        // In a real application, this would open an edit modal
        const newDescription = prompt('Edit description:', link.description);
        if (newDescription !== null) {
            link.description = newDescription;
            updateLinksTable();
        }
    }
}

function deleteLink(id) {
    if (confirm('Are you sure you want to delete this link?')) {
        linksData = linksData.filter(l => l.id !== id);
        updateLinksTable();
    }
}

function copyLink(shortUrl) {
    navigator.clipboard.writeText(`https://${shortUrl}`).then(() => {
        // Show toast notification
        showToast('Link copied to clipboard!');
    });
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Chart initialization (using Chart.js would be ideal, but here's a simple canvas example)
function initializeCharts() {
    // Simple chart examples - in production, use Chart.js or similar library
    drawClickChart();
    drawTrendsChart();
    drawDeviceChart();
}

function drawClickChart() {
    const canvas = document.getElementById('clickChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sample data for the last 7 days
    const data = [12, 19, 15, 25, 22, 30, 23];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Draw bars
    const barWidth = width / data.length;
    const maxValue = Math.max(...data);
    
    ctx.fillStyle = '#3b82f6';
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - 40);
        const x = index * barWidth + 10;
        const y = height - barHeight - 20;
        
        ctx.fillRect(x, y, barWidth - 20, barHeight);
        
        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + (barWidth - 20) / 2, height - 5);
        
        ctx.fillStyle = '#3b82f6';
    });
}

function drawTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sample trend data
    const data = [10, 15, 12, 18, 25, 22, 30, 28, 35, 32, 40, 38];
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    
    // Draw line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * (width - 40) + 20;
        const y = height - 40 - ((value - minValue) / range) * (height - 80);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw points
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.stroke();
}

function drawDeviceChart() {
    const canvas = document.getElementById('deviceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample device data
    const data = [
        { label: 'Desktop', value: 45, color: '#3b82f6' },
        { label: 'Mobile', value: 35, color: '#10b981' },
        { label: 'Tablet', value: 20, color: '#f59e0b' }
    ];
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(segment => {
        const sliceAngle = (segment.value / 100) * 2 * Math.PI;
        
        // Draw slice
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredLinks = linksData.filter(link => 
                link.shortUrl.toLowerCase().includes(searchTerm) ||
                link.originalUrl.toLowerCase().includes(searchTerm) ||
                link.description.toLowerCase().includes(searchTerm)
            );
            updateLinksTableWithData(filteredLinks);
        });
    }
}

function updateLinksTableWithData(data) {
    linksTableBody.innerHTML = '';
    
    data.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="short-url">${link.shortUrl}</span>
            </td>
            <td>
                <span class="original-url" title="${link.originalUrl}">
                    ${link.originalUrl.length > 50 ? link.originalUrl.substring(0, 50) + '...' : link.originalUrl}
                </span>
            </td>
            <td>${link.clicks}</td>
            <td>${formatDate(link.created)}</td>
            <td>
                <span class="status-badge ${link.status === 'active' ? 'status-active' : 'status-expired'}">
                    ${link.status}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="editLink(${link.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteLink(${link.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn" onclick="copyLink('${link.shortUrl}')" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        `;
        linksTableBody.appendChild(row);
    });
}

// Filter functionality
function initializeFilters() {
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filterValue = e.target.value;
            let filteredLinks = linksData;
            
            if (filterValue === 'Active') {
                filteredLinks = linksData.filter(link => link.status === 'active');
            } else if (filterValue === 'Expired') {
                filteredLinks = linksData.filter(link => link.status === 'expired');
            }
            
            updateLinksTableWithData(filteredLinks);
        });
    }
}

// Settings functionality
function initializeSettings() {
    const settingsForms = document.querySelectorAll('.settings-form');
    settingsForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Settings saved successfully!');
        });
    });
}

// Responsive handling
function handleResize() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('show');
        mainContent.classList.remove('expanded');
    }
}

// Add CSS animations dynamically
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeShortenForm();
    updateLinksTable();
    initializeCharts();
    initializeSearch();
    initializeFilters();
    initializeSettings();
    addAnimations();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Simulate some random click updates
    setInterval(() => {
        if (linksData.length > 0) {
            const randomIndex = Math.floor(Math.random() * linksData.length);
            if (linksData[randomIndex].status === 'active') {
                linksData[randomIndex].clicks += Math.floor(Math.random() * 3);
                updateLinksTable();
            }
        }
    }, 10000); // Update every 10 seconds
});

// Global functions for button actions
window.editLink = editLink;
window.deleteLink = deleteLink;
window.copyLink = copyLink;

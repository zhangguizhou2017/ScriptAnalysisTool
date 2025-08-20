class ScriptParserApp {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.apiUrl = '/api/scripts';
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadProjects();
        this.renderProjects();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        const backBtn = document.getElementById('backBtn');

        refreshBtn.addEventListener('click', () => this.refreshProjects());
        backBtn.addEventListener('click', () => this.showProjectsList());
    }

    async refreshProjects() {
        await this.loadProjects();
        this.renderProjects();
        this.showNotification('项目列表已刷新', 'success');
    }

    async loadProjects() {
        try {
            const response = await fetch(this.apiUrl);
            const result = await response.json();

            if (result.success) {
                this.projects = result.data;
            } else {
                this.showNotification('加载项目失败', 'error');
                this.projects = [];
            }
        } catch (error) {
            console.error('加载项目失败:', error);
            this.showNotification('加载失败，请检查网络连接', 'error');
            this.projects = [];
        }
    }

    renderProjects() {
        const projectsList = document.getElementById('projectsList');
        
        if (this.projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>📝 暂无剧本项目</h3>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = this.projects.map(project => `
            <div class="project-card" onclick="scriptApp.showProjectDetail(${project.id})">
                <div class="project-header">
                    <h3>🎭 ${this.escapeHtml(project.name)}</h3>
                    <span class="project-id">#${project.id}</span>
                </div>
                <div class="project-meta">
                    <p class="project-description">${this.escapeHtml(project.description || '无描述')}</p>
                    <div class="project-stats">
                        <span class="stat">📊 ${project.data_count || 0} 条数据</span>
                        <span class="stat">🏷️ ${project.tag_types ? project.tag_types.length : 0} 个标签</span>
                    </div>
                    <div class="project-tags">
                        ${project.tag_types ? project.tag_types.map(tag => 
                            `<span class="tag">${this.escapeHtml(tag)}</span>`
                        ).join('') : '<span class="no-tags">暂无标签</span>'}
                    </div>
                    <div class="project-date">
                        创建于: ${new Date(project.created_at).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async showProjectDetail(projectId) {
        try {
            const response = await fetch(`${this.apiUrl}/${projectId}`);
            const result = await response.json();

            if (result.success) {
                this.currentProject = result.data;
                this.renderProjectDetail();
                
                document.querySelector('.projects-section').style.display = 'none';
                document.getElementById('projectDetail').style.display = 'block';
            } else {
                this.showNotification('加载项目详情失败', 'error');
            }
        } catch (error) {
            console.error('加载项目详情失败:', error);
            this.showNotification('加载失败，请检查网络连接', 'error');
        }
    }

    renderProjectDetail() {
        if (!this.currentProject) return;

        const project = this.currentProject;
        document.getElementById('projectTitle').textContent = `🎭 ${project.name}`;
        
        const projectInfo = document.getElementById('projectInfo');
        projectInfo.innerHTML = `
            <div class="project-info-card">
                <h3>📋 项目信息</h3>
                <div class="info-item">
                    <strong>项目ID:</strong> ${project.id}
                </div>
                <div class="info-item">
                    <strong>项目名称:</strong> ${this.escapeHtml(project.name)}
                </div>
                <div class="info-item">
                    <strong>项目描述:</strong> ${this.escapeHtml(project.description || '无')}
                </div>
                <div class="info-item">
                    <strong>创建时间:</strong> ${new Date(project.created_at).toLocaleString()}
                </div>
                <div class="info-item">
                    <strong>更新时间:</strong> ${new Date(project.updated_at).toLocaleString()}
                </div>
            </div>
        `;

        const projectData = document.getElementById('projectData');
        if (!project.data_by_tag || project.data_by_tag.length === 0) {
            projectData.innerHTML = `
                <div class="empty-data">
                    <h3>📊 暂无解析数据</h3>
                    <p>请使用MCP工具解析剧本内容</p>
                    <p>可用的MCP工具：<code>parse_script_content</code></p>
                </div>
            `;
            return;
        }

        projectData.innerHTML = `
            <div class="data-section">
                <h3>📊 解析数据分类</h3>
                <div class="tabs-container">
                    <div class="tabs-header">
                        ${project.data_by_tag.map((tagData, index) => `
                            <button class="tab-btn ${index === 0 ? 'active' : ''}" 
                                    onclick="scriptApp.switchTab(${index})" 
                                    data-tab="${index}">
                                🏷️ ${this.escapeHtml(tagData.type)} 
                                <span class="tab-count">(${tagData.items.length})</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="tabs-content">
                        ${project.data_by_tag.map((tagData, index) => `
                            <div class="tab-pane ${index === 0 ? 'active' : ''}" data-tab-content="${index}">
                                <div class="tab-header">
                                    <h4>🏷️ ${this.escapeHtml(tagData.type)}</h4>
                                    <p class="tag-description">${this.escapeHtml(tagData.description || '')}</p>
                                </div>
                                <div class="tag-items">
                                    ${tagData.items.map((item, itemIndex) => `
                                        <div class="data-item">
                                            <div class="item-header">
                                                <span class="item-number">#${itemIndex + 1}</span>
                                                <span class="item-date">${new Date(item.created_at).toLocaleString()}</span>
                                            </div>
                                            ${item.summary ? `
                                                <div class="item-summary">
                                                    <strong>总结:</strong> ${this.escapeHtml(item.summary)}
                                                </div>
                                            ` : ''}
                                            <div class="item-content">
                                                <strong>内容:</strong> ${this.escapeHtml(item.content)}
                                            </div>
                                            ${item.metadata && Object.keys(item.metadata).length > 0 ? `
                                                <div class="item-metadata">
                                                    <strong>元数据:</strong> ${this.escapeHtml(JSON.stringify(item.metadata))}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabIndex) {
        // 移除所有活跃状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // 激活选中的tab
        document.querySelector(`[data-tab="${tabIndex}"]`).classList.add('active');
        document.querySelector(`[data-tab-content="${tabIndex}"]`).classList.add('active');
    }

    showProjectsList() {
        document.getElementById('projectDetail').style.display = 'none';
        document.querySelector('.projects-section').style.display = 'block';
        this.currentProject = null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            case 'info':
                notification.style.background = '#17a2b8';
                break;
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const scriptApp = new ScriptParserApp();
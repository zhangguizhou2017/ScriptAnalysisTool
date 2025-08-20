const Router = require('koa-router');
const db = require('../config/database');

const router = new Router();

// 创建剧本项目
router.post('/', async (ctx) => {
    try {
        const { name, description } = ctx.request.body;
        
        if (!name) {
            ctx.status = 400;
            ctx.body = { success: false, message: '项目名称不能为空' };
            return;
        }
        
        const [result] = await db.execute(
            'INSERT INTO script_projects (name, description) VALUES (?, ?)',
            [name, description || '']
        );
        
        ctx.body = {
            success: true,
            data: {
                id: result.insertId,
                name,
                description: description || ''
            }
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '创建项目失败', error: error.message };
    }
});

// 获取所有剧本项目
router.get('/', async (ctx) => {
    try {
        const [projects] = await db.execute(`
            SELECT sp.*, 
                   COUNT(sd.id) as data_count,
                   GROUP_CONCAT(DISTINCT tt.name) as tag_types
            FROM script_projects sp 
            LEFT JOIN script_data sd ON sp.id = sd.project_id
            LEFT JOIN tag_types tt ON sd.tag_type_id = tt.id
            GROUP BY sp.id
            ORDER BY sp.created_at DESC
        `);
        
        ctx.body = {
            success: true,
            data: projects.map(project => ({
                ...project,
                tag_types: project.tag_types ? project.tag_types.split(',') : []
            }))
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '获取项目列表失败', error: error.message };
    }
});

// 获取单个剧本项目详情
router.get('/:id', async (ctx) => {
    try {
        const projectId = ctx.params.id;
        
        const [projects] = await db.execute(
            'SELECT * FROM script_projects WHERE id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            ctx.status = 404;
            ctx.body = { success: false, message: '项目不存在' };
            return;
        }
        
        const [scriptData] = await db.execute(`
            SELECT sd.*, tt.name as tag_type_name, tt.description as tag_type_description
            FROM script_data sd
            JOIN tag_types tt ON sd.tag_type_id = tt.id
            WHERE sd.project_id = ?
            ORDER BY tt.name, sd.created_at DESC
        `, [projectId]);
        
        const project = projects[0];
        const dataByTagType = {};
        
        scriptData.forEach(data => {
            if (!dataByTagType[data.tag_type_name]) {
                dataByTagType[data.tag_type_name] = {
                    type: data.tag_type_name,
                    description: data.tag_type_description,
                    items: []
                };
            }
            dataByTagType[data.tag_type_name].items.push({
                id: data.id,
                content: data.content,
                summary: data.summary,
                metadata: data.metadata,
                created_at: data.created_at,
                updated_at: data.updated_at
            });
        });
        
        ctx.body = {
            success: true,
            data: {
                ...project,
                data_by_tag: Object.values(dataByTagType)
            }
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '获取项目详情失败', error: error.message };
    }
});

// 为项目添加解析数据 (MCP专用接口)
router.post('/:id/parse', async (ctx) => {
    try {
        const projectId = ctx.params.id;
        const { tag_type, items } = ctx.request.body;
        
        if (!tag_type || !items || !Array.isArray(items)) {
            ctx.status = 400;
            ctx.body = { success: false, message: '请提供标签类型和解析项目' };
            return;
        }
        
        // 验证项目存在
        const [projects] = await db.execute(
            'SELECT id FROM script_projects WHERE id = ?',
            [projectId]
        );
        
        if (projects.length === 0) {
            ctx.status = 404;
            ctx.body = { success: false, message: '项目不存在' };
            return;
        }
        
        // 获取或创建标签类型
        let [tagTypes] = await db.execute(
            'SELECT id FROM tag_types WHERE name = ?',
            [tag_type]
        );
        
        let tagTypeId;
        if (tagTypes.length === 0) {
            const [result] = await db.execute(
                'INSERT INTO tag_types (name) VALUES (?)',
                [tag_type]
            );
            tagTypeId = result.insertId;
        } else {
            tagTypeId = tagTypes[0].id;
        }
        
        // 批量插入解析数据
        const insertPromises = items.map(item => {
            const { content, summary, metadata } = item;
            return db.execute(
                'INSERT INTO script_data (project_id, tag_type_id, content, summary, metadata) VALUES (?, ?, ?, ?, ?)',
                [projectId, tagTypeId, content, summary || '', JSON.stringify(metadata || {})]
            );
        });
        
        await Promise.all(insertPromises);
        
        ctx.body = {
            success: true,
            message: `成功添加 ${items.length} 个${tag_type}项目`,
            data: {
                project_id: projectId,
                tag_type,
                count: items.length
            }
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '解析数据添加失败', error: error.message };
    }
});

// 获取标签类型列表
router.get('/tag-types/list', async (ctx) => {
    try {
        const [tagTypes] = await db.execute(`
            SELECT tt.*, COUNT(sd.id) as usage_count
            FROM tag_types tt
            LEFT JOIN script_data sd ON tt.id = sd.tag_type_id
            GROUP BY tt.id
            ORDER BY tt.name
        `);
        
        ctx.body = {
            success: true,
            data: tagTypes
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '获取标签类型失败', error: error.message };
    }
});

// 根据标签类型获取数据
router.get('/:id/tag/:tagType', async (ctx) => {
    try {
        const { id: projectId, tagType } = ctx.params;
        
        const [data] = await db.execute(`
            SELECT sd.*, tt.name as tag_type_name
            FROM script_data sd
            JOIN tag_types tt ON sd.tag_type_id = tt.id
            WHERE sd.project_id = ? AND tt.name = ?
            ORDER BY sd.created_at DESC
        `, [projectId, tagType]);
        
        ctx.body = {
            success: true,
            data: {
                project_id: projectId,
                tag_type: tagType,
                items: data.map(item => ({
                    id: item.id,
                    content: item.content,
                    summary: item.summary,
                    metadata: item.metadata,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }))
            }
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '获取标签数据失败', error: error.message };
    }
});

// 删除剧本项目
router.delete('/:id', async (ctx) => {
    try {
        const projectId = ctx.params.id;
        
        const [result] = await db.execute(
            'DELETE FROM script_projects WHERE id = ?',
            [projectId]
        );
        
        if (result.affectedRows === 0) {
            ctx.status = 404;
            ctx.body = { success: false, message: '项目不存在' };
            return;
        }
        
        ctx.body = {
            success: true,
            message: '项目删除成功'
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: '删除项目失败', error: error.message };
    }
});

module.exports = router;
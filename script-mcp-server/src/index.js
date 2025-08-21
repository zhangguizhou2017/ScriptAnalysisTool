#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SCRIPT_API_BASE = process.env.SCRIPT_API_URL || 'http://your-domain.com';
const API_KEY = process.env.SCRIPT_API_KEY || '';

class ScriptParserMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'script-parser-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  async makeApiRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${SCRIPT_API_BASE}/api/scripts${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'X-API-Key': API_KEY }),
        },
      };

      if (data) {
        config.data = data;
      }

      console.error(`[DEBUG] Making ${method} request to: ${config.url}`);
      console.error(`[DEBUG] Request data:`, JSON.stringify(data));
      
      const response = await axios(config);
      console.error(`[DEBUG] Response status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`[ERROR] API request failed:`);
      console.error(`[ERROR] URL: ${SCRIPT_API_BASE}/api/scripts${endpoint}`);
      console.error(`[ERROR] Method: ${method}`);
      console.error(`[ERROR] Data:`, JSON.stringify(data));
      console.error(`[ERROR] Status: ${error.response?.status}`);
      console.error(`[ERROR] Response:`, error.response?.data);
      console.error(`[ERROR] Message: ${error.message}`);
      throw new Error(`API 请求失败: ${error.response?.data?.message || error.message}`);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_script_project',
            description: '创建新的剧本解析项目',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: '项目名称',
                },
                description: {
                  type: 'string',
                  description: '项目描述（可选）',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'list_script_projects',
            description: '获取所有剧本项目列表',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_script_project',
            description: '获取指定剧本项目的详细信息',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: '项目ID',
                },
              },
              required: ['project_id'],
            },
          },
          {
            name: 'parse_script_content',
            description: '解析剧本内容并按标签分类存储。这是核心功能，用于从剧本中提取人物、场景等信息',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: '项目ID',
                },
                tag_type: {
                  type: 'string',
                  description: '标签类型（如：人物、场景、道具、情节、对话、动作）',
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      content: {
                        type: 'string',
                        description: '解析出的原始内容',
                      },
                      summary: {
                        type: 'string',
                        description: '内容总结（可选）',
                      },
                      metadata: {
                        type: 'object',
                        description: '额外的元数据信息（可选）',
                      },
                    },
                    required: ['content'],
                  },
                  description: '解析出的项目列表',
                },
              },
              required: ['project_id', 'tag_type', 'items'],
            },
          },
          {
            name: 'get_script_data_by_tag',
            description: '根据标签类型获取剧本解析数据',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: '项目ID',
                },
                tag_type: {
                  type: 'string',
                  description: '标签类型（如：人物、场景、道具等）',
                },
              },
              required: ['project_id', 'tag_type'],
            },
          },
          {
            name: 'list_tag_types',
            description: '获取所有可用的标签类型',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'delete_script_project',
            description: '删除剧本项目',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'number',
                  description: '要删除的项目ID',
                },
              },
              required: ['project_id'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_script_project': {
            const result = await this.makeApiRequest('POST', '', {
              name: args.name,
              description: args.description,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ 成功创建剧本项目: "${result.data.name}" (ID: ${result.data.id})`,
                },
              ],
            };
          }

          case 'list_script_projects': {
            const result = await this.makeApiRequest('GET', '');
            if (result.data.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: '📝 暂无剧本项目',
                  },
                ],
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: `📚 找到 ${result.data.length} 个剧本项目:\\n\\n${result.data
                    .map(
                      (project) =>
                        `🎭 [ID: ${project.id}] ${project.name}\\n   描述: ${project.description || '无'}\\n   数据量: ${project.data_count} 条\\n   标签类型: ${project.tag_types.join(', ') || '无'}`
                    )
                    .join('\\n\\n')}`,
                },
              ],
            };
          }

          case 'get_script_project': {
            const result = await this.makeApiRequest('GET', `/${args.project_id}`);
            const project = result.data;
            let text = `🎭 项目: ${project.name}\\n📝 描述: ${project.description || '无'}\\n📅 创建时间: ${project.created_at}\\n\\n`;
            
            if (project.data_by_tag.length === 0) {
              text += '📊 该项目暂无解析数据';
            } else {
              text += '📊 解析数据分类:\\n\\n';
              project.data_by_tag.forEach(tagData => {
                text += `🏷️ ${tagData.type} (${tagData.items.length} 条):\\n`;
                tagData.items.slice(0, 3).forEach((item, index) => {
                  text += `   ${index + 1}. ${item.summary || item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}\\n`;
                });
                if (tagData.items.length > 3) {
                  text += `   ... 还有 ${tagData.items.length - 3} 条\\n`;
                }
                text += '\\n';
              });
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: text,
                },
              ],
            };
          }

          case 'parse_script_content': {
            const result = await this.makeApiRequest('POST', `/${args.project_id}/parse`, {
              tag_type: args.tag_type,
              items: args.items,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ 成功解析并存储剧本内容:\\n🏷️ 标签类型: ${args.tag_type}\\n📊 解析项目: ${args.items.length} 条\\n💾 已存储到项目 ID: ${args.project_id}`,
                },
              ],
            };
          }

          case 'get_script_data_by_tag': {
            const result = await this.makeApiRequest('GET', `/${args.project_id}/tag/${args.tag_type}`);
            const data = result.data;
            
            if (data.items.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `📝 项目 ${data.project_id} 中暂无 "${data.tag_type}" 类型的数据`,
                  },
                ],
              };
            }
            
            let text = `🏷️ ${data.tag_type} 数据 (共 ${data.items.length} 条):\\n\\n`;
            data.items.forEach((item, index) => {
              text += `${index + 1}. ${item.summary || item.content}\\n`;
              if (item.summary && item.content !== item.summary) {
                text += `   原文: ${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}\\n`;
              }
              text += `   创建时间: ${item.created_at}\\n\\n`;
            });
            
            return {
              content: [
                {
                  type: 'text',
                  text: text,
                },
              ],
            };
          }

          case 'list_tag_types': {
            const result = await this.makeApiRequest('GET', '/tag-types/list');
            return {
              content: [
                {
                  type: 'text',
                  text: `🏷️ 可用的标签类型:\\n\\n${result.data
                    .map(
                      (tagType) =>
                        `📌 ${tagType.name}: ${tagType.description || '无描述'} (使用 ${tagType.usage_count} 次)`
                    )
                    .join('\\n')}`,
                },
              ],
            };
          }

          case 'delete_script_project': {
            await this.makeApiRequest('DELETE', `/${args.project_id}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ 成功删除剧本项目 (ID: ${args.project_id})`,
                },
              ],
            };
          }

          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ 执行失败: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Script Parser MCP Server 已启动');
  }
}

const server = new ScriptParserMCPServer();
server.run().catch(console.error);
'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Save, X, Loader2 } from 'lucide-react';

// Logger implementation similar to SLF4J
class Logger {
  private className: string;
  
  constructor(className: string) {
    this.className = className;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` | Args: ${JSON.stringify(args)}` : '';
    return `[${timestamp}] ${level} ${this.className} - ${message}${formattedArgs}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message, ...args));
  }

  error(message: string, error?: Error, ...args: any[]): void {
    const errorInfo = error ? ` | Error: ${error.message} | Stack: ${error.stack}` : '';
    console.error(this.formatMessage('ERROR', message, ...args) + errorInfo);
  }

  trace(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.trace(this.formatMessage('TRACE', message, ...args));
    }
  }
}

// LoggerFactory similar to SLF4J
class LoggerFactory {
  static getLogger(className: string): Logger {
    return new Logger(className);
  }
}

interface Item {
  id?: string;
  name: string;
  description: string;
  category?: string;
  price?: number;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${process.env.NEXT_PUBLIC_API_ENDPOINT || '/items'}`;

export default function ItemsManagementApp() {
  const logger = LoggerFactory.getLogger('ItemsManagementApp');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState<Item>({
    name: '',
    description: '',
    category: '',
    price: 0
  });

  // Fetch all items
  const fetchItems = async () => {
    logger.info('Starting to fetch all items');
    logger.debug('API URL configured', { url: API_BASE_URL });
    
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const response = await fetch(API_BASE_URL);
      const endTime = Date.now();
      
      logger.info('HTTP request completed', { 
        duration: endTime - startTime, 
        status: response.status,
        url: API_BASE_URL 
      });
      
      if (!response.ok) {
        logger.error('HTTP request failed with non-OK status', { status: response.status });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      logger.debug('Response data received', { 
        dataType: typeof data, 
        isArray: Array.isArray(data),
        itemCount: Array.isArray(data) ? data.length : 0 
      });
      
      const itemsArray = Array.isArray(data) ? data : [];
      setItems(itemsArray);
      logger.info('Items successfully loaded', { count: itemsArray.length });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Failed to fetch items', error, { operation: 'fetchItems' });
      setError(error.message);
      setItems([]);
    } finally {
      setLoading(false);
      logger.debug('Fetch operation completed');
    }
  };

  // Create new item
  const createItem = async (item: Item) => {
    logger.info('Starting item creation process');
    logger.debug('Item data for creation', item);
    
    try {
      setLoading(true);
      
      const requestBody = JSON.stringify(item);
      logger.trace('Request payload prepared', { bodySize: requestBody.length });
      
      const startTime = Date.now();
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      const endTime = Date.now();
      
      logger.info('Create request completed', { 
        duration: endTime - startTime,
        status: response.status,
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Create request failed', new Error(`HTTP ${response.status}`), { 
          responseBody: errorText,
          status: response.status 
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      logger.debug('Item created successfully', { createdItem: responseData });
      
      logger.info('Refreshing items list after creation');
      await fetchItems();
      
      setShowCreateForm(false);
      setNewItem({ name: '', description: '', category: '', price: 0 });
      logger.info('Item creation process completed successfully');
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Item creation failed', error, { operation: 'createItem', itemData: item });
      setError(error.message);
    } finally {
      setLoading(false);
      logger.debug('Create operation cleanup completed');
    }
  };

  // Update item
  const updateItem = async (item: Item) => {
    if (!item.id) {
      logger.warn('Update attempted without item ID', { item });
      return;
    }
    
    logger.info('Starting item update process', { itemId: item.id });
    logger.debug('Update item data', item);
    
    try {
      setLoading(true);
      
      const requestBody = JSON.stringify(item);
      const url = `${API_BASE_URL}/${item.id}`;
      logger.trace('Update request prepared', { url, bodySize: requestBody.length });
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      const endTime = Date.now();
      
      logger.info('Update request completed', { 
        duration: endTime - startTime,
        status: response.status,
        method: 'PUT',
        itemId: item.id
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Update request failed', new Error(`HTTP ${response.status}`), { 
          responseBody: errorText,
          status: response.status,
          itemId: item.id 
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      logger.debug('Item updated successfully', { updatedItem: responseData });
      
      logger.info('Refreshing items list after update');
      await fetchItems();
      setEditingItem(null);
      logger.info('Item update process completed successfully', { itemId: item.id });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Item update failed', error, { operation: 'updateItem', itemId: item.id, itemData: item });
      setError(error.message);
    } finally {
      setLoading(false);
      logger.debug('Update operation cleanup completed');
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    logger.info('Starting item deletion process', { itemId: id });
    
    try {
      setLoading(true);
      
      const url = `${API_BASE_URL}/${id}`;
      logger.trace('Delete request prepared', { url, method: 'DELETE' });
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'DELETE',
      });
      const endTime = Date.now();
      
      logger.info('Delete request completed', { 
        duration: endTime - startTime,
        status: response.status,
        method: 'DELETE',
        itemId: id
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Delete request failed', new Error(`HTTP ${response.status}`), { 
          responseBody: errorText,
          status: response.status,
          itemId: id 
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      logger.debug('Item deleted successfully', { itemId: id });
      logger.info('Refreshing items list after deletion');
      await fetchItems();
      logger.info('Item deletion process completed successfully', { itemId: id });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Item deletion failed', error, { operation: 'deleteItem', itemId: id });
      setError(error.message);
    } finally {
      setLoading(false);
      logger.debug('Delete operation cleanup completed');
    }
  };

  useEffect(() => {
    logger.info('ItemsManagementApp component initialized');
    logger.debug('Application configuration', { 
      apiBaseUrl: API_BASE_URL,
      environment: process.env.NODE_ENV,
      logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info'
    });
    
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Items Management</h1>
                <p className="text-gray-600 mt-1">Manage your items collection</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* API Status */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Endpoint: {API_BASE_URL}</span>
              <button
                onClick={fetchItems}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create New Item</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => createItem(newItem)}
                  disabled={loading || !newItem.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create Item
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Items ({items.length})
            </h2>
          </div>
          
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first item to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-6">
                  {editingItem?.id === item.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={editingItem.category || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingItem.price || 0}
                            onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateItem(editingItem)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Item
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          {item.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {item.category}
                            </span>
                          )}
                          {item.price !== undefined && item.price > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <p className="text-xs text-gray-400">ID: {item.id}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => item.id && deleteItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
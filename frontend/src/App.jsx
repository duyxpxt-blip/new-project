import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Circle, ListFilter, ClipboardList, 
  ChevronLeft, ChevronRight, Calendar, Clock, Bell, X, 
  AlertTriangle, Search, Edit3, Check, Save
} from 'lucide-react';
import TaskService from './services/TaskService';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState(null); // Now stores a Date object if set
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

  useEffect(() => {
    fetchTasks();
  }, []);

  // Optimized background check
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'active' && task.scheduledAt) {
          const scheduledDate = new Date(task.scheduledAt);
          if (scheduledDate <= now && now - scheduledDate < 60000) {
            const alreadyNotified = notifications.find(n => n.taskId === task._id);
            if (!alreadyNotified) {
              addNotification(task);
            }
          }
        }
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [tasks, notifications.length]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await TaskService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Lỗi khi tải nhiệm vụ:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (task) => {
    const id = Date.now();
    setNotifications(prev => [{
      id,
      taskId: task._id,
      title: task.title,
      time: new Date(task.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);

    setTimeout(() => removeNotification(id), 10000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const task = await TaskService.createTask({
        title: newTaskTitle,
        description: '',
        status: 'active',
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null
      });
      setTasks([task, ...tasks]);
      setNewTaskTitle('');
      setScheduledAt(null);
      setShowTimePicker(false);
    } catch (error) {
      console.error('Lỗi khi thêm nhiệm vụ:', error);
    }
  };

  const handleTimeDone = () => {
    const date = new Date();
    date.setHours(selectedHour, selectedMinute, 0, 0);
    setScheduledAt(date);
    setShowTimePicker(false);
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'active' ? 'completed' : 'active';
    try {
      const updatedTask = await TaskService.updateTask(task._id, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task._id);
    setEditData({ title: task.title, description: task.description || '' });
  };

  const saveEdit = async (id) => {
    try {
      const updatedTask = await TaskService.updateTask(id, { 
        title: editData.title, 
        description: editData.description 
      });
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Lỗi khi lưu chỉnh sửa:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await TaskService.deleteTask(id);
      setTasks(tasks.filter(t => t._id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Lỗi khi xóa nhiệm vụ:', error);
    }
  };

  const activeCount = tasks.filter(t => t.status === 'active').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filter === 'all' || task.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [tasks, filter, searchQuery]);

  return (
    <div className="animate-fade-in">
      {/* Notifications */}
      <div className="notification-center">
        {notifications.map(n => (
          <div key={n.id} className="toast">
            <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '12px' }}>
              <Bell size={24} color="var(--primary)" />
            </div>
            <div className="toast-content">
              <div className="toast-title">Nhiệm vụ đến hạn!</div>
              <div className="toast-text" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{n.title}</div>
              <div className="toast-time">Bắt đầu lúc {n.time}</div>
            </div>
            <button className="toast-close" onClick={() => removeNotification(n.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Xác nhận xóa?</div>
            <p style={{ color: 'var(--text-muted)' }}>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa nhiệm vụ này?</p>
            <div className="confirm-btns">
              <button className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>Hủy</button>
              <button className="btn-danger" onClick={() => deleteTask(deleteConfirmId)}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Header */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500, marginBottom: '2rem' }}>
          Không có việc gì khó, chỉ sợ mình không làm 💪
        </p>
      </header>

      <main className="glass-container">
        {/* Input Form */}
        <div className="custom-input-group" style={{ position: 'relative' }}>
          <input
            type="text"
            className="custom-input"
            placeholder="Cần phải làm gì?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button 
            type="button"
            onClick={() => setShowTimePicker(!showTimePicker)}
            style={{ 
              background: scheduledAt ? 'var(--primary)' : 'transparent', 
              color: scheduledAt ? 'white' : 'var(--text-muted)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Clock size={20} />
            {scheduledAt && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
          </button>
          <button onClick={addTask} className="add-btn">
            <Plus size={20} />
            Thêm
          </button>

          {showTimePicker && (
            <div className="time-input-container" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, marginTop: '0.5rem' }}>
              <div className="time-picker-grid">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="time-display-large">
                    {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div className="time-column">
                      <div className="time-column-header">Giờ</div>
                      {hours.map(h => (
                        <div 
                          key={h} 
                          className={`time-unit ${selectedHour === h ? 'active' : ''}`}
                          onClick={() => setSelectedHour(h)}
                        >
                          {String(h).padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                    <div className="time-column">
                      <div className="time-column-header">Phút</div>
                      {minutes.map(m => (
                        <div 
                          key={m} 
                          className={`time-unit ${selectedMinute === m ? 'active' : ''}`}
                          onClick={() => setSelectedMinute(m)}
                        >
                          {String(m).padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="time-picker-actions">
                    <button className="time-picker-btn btn-clear" onClick={() => { setScheduledAt(null); setShowTimePicker(false); }}>Xóa</button>
                    <button className="time-picker-btn btn-done" onClick={handleTimeDone}>Xong</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Tìm kiếm nhiệm vụ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Counters & Primary Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="status-chip">
              <span className="count">{activeCount}</span> đang làm
            </div>
            <div className="status-chip">
              <span className="count">{completedCount}</span> hoàn thành
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '14px', gap: '0.25rem' }}>
            {[
              { id: 'all', label: 'Tất Cả', icon: null },
              { id: 'active', label: 'Đang Làm', icon: <ListFilter size={16} /> },
              { id: 'completed', label: 'Hoàn Thành', icon: <ListFilter size={16} /> }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  background: filter === f.id ? 'var(--primary)' : 'transparent',
                  color: filter === f.id ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div style={{ 
          background: '#f8fafc', 
          borderRadius: '24px', 
          padding: '2rem', 
          minHeight: '200px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}> Đang tải...</div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ 
                width: '64px', height: '64px', background: '#e2e8f0', 
                borderRadius: '50%', margin: '0 auto 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '4px solid #f1f5f9'
              }}>
                <ClipboardList size={32} color="#94a3b8" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                {searchQuery ? 'Không tìm thấy kết quả.' : 'Chưa có nhiệm vụ.'}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {searchQuery ? 'Hãy thử từ khóa khác.' : 'Thêm nhiệm vụ đầu tiên vào để bắt đầu!'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task._id} 
                className="animate-fade-in"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.5rem', 
                  padding: '1.25rem', 
                  background: 'white', 
                  borderRadius: '18px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div 
                    onClick={() => toggleTaskStatus(task)} 
                    style={{ cursor: 'pointer', color: task.status === 'completed' ? 'var(--success)' : '#e2e8f0' }}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    {editingTaskId === task._id ? (
                      <input 
                        className="edit-input" 
                        value={editData.title}
                        onChange={e => setEditData({...editData, title: e.target.value})}
                        autoFocus
                      />
                    ) : (
                      <div style={{ 
                        fontSize: '1.05rem', 
                        fontWeight: 500, 
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                    )}
                    
                    {task.scheduledAt && task.status === 'active' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                        <Clock size={12} />
                        {new Date(task.scheduledAt).toLocaleString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {editingTaskId === task._id ? (
                      <button 
                        onClick={() => saveEdit(task._id)}
                        style={{ color: 'var(--success)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <Save size={20} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => startEditing(task)}
                        style={{ color: '#e2e8f0', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.color = '#e2e8f0'}
                      >
                        <Edit3 size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteConfirmId(task._id)}
                      style={{ color: '#e2e8f0', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseOut={e => e.currentTarget.style.color = '#e2e8f0'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {(editingTaskId === task._id || task.description) && (
                  <div style={{ paddingLeft: '2.5rem' }}>
                    {editingTaskId === task._id ? (
                      <textarea 
                        className="edit-textarea"
                        placeholder="Thêm mô tả..."
                        value={editData.description}
                        onChange={e => setEditData({...editData, description: e.target.value})}
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {task.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Navigation */}
        <div className="nav-footer">
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span className="nav-link"><ChevronLeft size={18} /> Trước</span>
            <span className="nav-link">Sau <ChevronRight size={18} /></span>
          </div>
          
          <div className="today-dropdown">
            <Calendar size={16} /> Hôm nay <ChevronDown size={14} />
          </div>
        </div>
      </main>
    </div>
  );
}

const ChevronDown = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

export default App;

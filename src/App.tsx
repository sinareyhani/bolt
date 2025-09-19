import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Todo App
        </h1>
        
        {/* Add Todo Input */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addTodo}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          {(['all', 'active', 'completed'] as Filter[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors duration-200 ${
                filter === filterType
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredTodos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'all' ? 'No todos yet. Add one above!' : 
               filter === 'active' ? 'No active todos!' : 'No completed todos!'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTodos.map((todo) => (
                <li key={todo.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && <Check size={16} />}
                    </button>
                    <span
                      className={`flex-1 transition-all duration-200 ${
                        todo.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-800'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {activeCount} {activeCount === 1 ? 'item' : 'items'} left
              </span>
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                >
                  Clear completed ({completedCount})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
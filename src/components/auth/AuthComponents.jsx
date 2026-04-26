// 認證頁面的通用 Logo 和標題組件
export function AuthHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="text-center mb-4 sm:mb-8">
      <div className="flex justify-center mb-2 sm:mb-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
          {Icon ? (
            <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} />
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// 通用的認證卡片容器
export function AuthCard({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

// 通用的錯誤和成功消息組件
export function AlertMessage({ type, message }) {
  const styles = {
    error: {
      backgroundColor: '#fee',
      color: 'var(--error)',
      border: '1px solid var(--error)'
    },
    success: {
      backgroundColor: '#e8f5e8',
      color: '#2d5f2d',
      border: '1px solid #4caf50'
    },
    info: {
      backgroundColor: '#e3f2fd',
      color: '#1565c0',
      border: '1px solid #1976d2'
    }
  };

  return (
    <div className="p-4 rounded-lg" style={styles[type] || styles.info} role="alert" aria-live="assertive">
      {message}
    </div>
  );
}

// 通用的表單輸入組件
export function FormInput({ 
  id, 
  name, 
  type = "text", 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false,
  autoComplete 
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && "*"}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
}

// 通用的選擇框組件
export function FormSelect({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  error, 
  required = false,
  options = [],
  placeholder = "請選擇..."
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && "*"}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        className="input-field"
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
}

// 狀態頁面組件（成功、錯誤、加載中）
export function StatusPage({ 
  type, // 'success', 'error', 'loading'
  title, 
  message, 
  icon: Icon,
  children 
}) {
  const iconColors = {
    success: 'text-green-700',
    error: 'text-red-600',
    loading: 'text-blue-600'
  };

  const bgColors = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    loading: 'bg-blue-100'
  };

  return (
    <div className="max-w-sm sm:max-w-md w-full mx-auto">
      <div className="card text-center">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 ${bgColors[type]} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
          {Icon ? (
            <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColors[type]}`} />
          ) : type === 'loading' ? (
            <div className={`animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 ${iconColors[type]}`}></div>
          ) : (
            <svg className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColors[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
          )}
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        
        {message && (
          <div className="mb-4 sm:mb-6">
            <AlertMessage type={type} message={message} />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

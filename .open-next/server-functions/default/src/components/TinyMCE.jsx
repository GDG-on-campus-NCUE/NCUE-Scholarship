'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const TinyMceEditor = ({ value, onChange, placeholder, disabled }) => {
    const [isClient, setIsClient] = useState(false);
    const editorRef = useRef(null);

    useEffect(() => {
        // 這個 effect 確保程式碼只在客戶端執行，以避免 Next.js 的 SSR (伺服器端渲染) 問題。
        setIsClient(true);
    }, []);

    const handleEditorChange = (content, editor) => {
        // 當編輯器內容改變時，呼叫從 props 傳入的 onChange 函式，
        // 將新的內容傳回給父元件，更新父元件的狀態。
        onChange(content);
    };

    // 如果還沒切換到客戶端環境，顯示一個載入提示。
    // 這是因為 TinyMCE 這種複雜的編輯器依賴瀏覽器環境 (window, document)，無法在伺服器端渲染。
    if (!isClient) {
        return (
            <div
                style={{
                    minHeight: '350px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    color: '#666'
                }}
            >
                載入編輯器中...
            </div>
        );
    }

    return (
        <>
            {/* 這些是全域 CSS 樣式，用來確保在編輯器外部顯示內容時，表格能有正確的樣式。 */}
            <style jsx global>{`
                .rich-text-content table {
                    width: 100% !important;
                    border-collapse: collapse;
                }
                .rich-text-content td,
                .rich-text-content th {
                    border: 1px solid #ccc;
                    padding: 8px;
                }
            `}</style>
            <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                onInit={(evt, editor) => editorRef.current = editor}
                
                // --- 修正點 ---
                // 將 initialValue 改為 value。
                // initialValue 只在元件首次掛載時生效。
                // 使用 value 才能讓編輯器成為一個真正的「受控元件」，
                // 其內容會跟隨 props 的變化而更新，且不會遺失游標位置。
                value={value || ''}
                
                onEditorChange={handleEditorChange}
                disabled={disabled}
                init={{
                    min_height: 350,
                    autoresize_bottom_margin: 25,
                    resize: 'vertical',
                    language: 'zh_TW',
                    language_url: '/langs/zh_TW.js',
                    placeholder: placeholder || '',

                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                        'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                        'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
                        'autoresize', 'codesample', 'emoticons'
                    ],
                    toolbar:
                        'undo redo | styles | bold italic underline strikethrough | ' +
                        'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
                        'bullist numlist outdent indent | link image media | ' +
                        'table codesample emoticons | removeformat | fullscreen preview code | help',

                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',

                    table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
                    image_advtab: true,
                    image_caption: true,
                    image_title: true,
                    paste_data_images: true, // 允許直接貼上圖片
                    menubar: true,
                }}
            />
        </>
    );
};

export default TinyMceEditor;

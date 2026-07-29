export default function ConnStatus({ connected }) {
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: '0.75rem',
        color: connected ? '#5a8a5f' : 'var(--danger)',
        marginBottom: '18px'
      }}
    >
      {connected
        ? '● 已連接本機伺服器，資料會存到 writing_material_data.json'
        : '● 尚未連接到 Python 伺服器，目前只存在此瀏覽器（請執行 server.py 並改用 http://127.0.0.1:8899/ 開啟）'}
    </div>
  );
}

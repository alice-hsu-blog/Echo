export default function Stats({ db }) {
  const totalPractices = db.quotes.reduce(
    (sum, q) => sum + q.scenarios.reduce((s2, sc) => s2 + sc.practices.length, 0),
    0
  );
  return (
    <div className="stats">
      <div>
        <b>{db.quotes.length}</b> 則名言
      </div>
      <div>
        <b>{totalPractices}</b> 篇仿寫練習
      </div>
    </div>
  );
}

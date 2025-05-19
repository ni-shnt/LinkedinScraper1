
export default function Test() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Page</h1>
      <div className="bg-gray-100 p-4 rounded-md">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => alert('Test successful!')}>
          Test Button
        </button>
      </div>
    </div>
  );
}

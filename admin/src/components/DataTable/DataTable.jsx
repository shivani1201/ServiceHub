import './DataTable.css';

const DataTable = ({ columns, data, keyField = '_id' }) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} style={{ textAlign: column.align || 'left', width: column.width }}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row[keyField]}>
            {columns.map((column) => (
              <td key={column.key} style={{ textAlign: column.align || 'left' }}>{column.render ? column.render(row) : row[column.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;

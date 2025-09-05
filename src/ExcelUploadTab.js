import React, { useState, useRef } from 'react';
import ExcelItemizer from './ExcelItemizer';

const ExcelUploadTab = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mask, setMask] = useState('XXXX.XX.XX.XX.XX.XX');
  const [startNumber, setStartNumber] = useState('1');
  const [descriptions, setDescriptions] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState(null);
  const [selectedDescriptionColumn, setSelectedDescriptionColumn] = useState(null);
  
  const fileInputRef = useRef(null);
  const excelItemizer = useRef(new ExcelItemizer());

  // Função para lidar com upload de arquivo
  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setResults([]);
    setShowResults(false);

    // Processar arquivo
    setIsProcessing(true);
    try {
      const result = await excelItemizer.current.processExcelFile(selectedFile);
      
      if (result.success) {
        setSuccess(result.message);
        
        // Detectar colunas automaticamente
        const columns = excelItemizer.current.detectColumns();
        setDetectedColumns(columns);
        
        // Se encontrou coluna de descrição, usar automaticamente
        if (columns && columns.description !== null) {
          setSelectedDescriptionColumn(columns.description);
          extractDescriptions(columns.description);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao processar arquivo: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para extrair descrições
  const extractDescriptions = (columnIndex) => {
    const extracted = excelItemizer.current.extractDescriptions(columnIndex);
    setDescriptions(extracted);
    setSelectedDescriptionColumn(columnIndex);
    
    if (extracted.length > 0) {
      setSuccess(`${extracted.length} descrições extraídas com sucesso!`);
    } else {
      setError('Nenhuma descrição encontrada na coluna selecionada.');
    }
  };

  // Função para gerar itemização
  const generateItemization = () => {
    if (descriptions.length === 0) {
      setError('Nenhuma descrição disponível para itemizar.');
      return;
    }

    try {
      const result = excelItemizer.current.generateItemizationByDescription(
        descriptions, 
        mask, 
        startNumber
      );

      if (result.success) {
        setResults(result.results);
        setShowResults(true);
        setSuccess(result.message);
        setError('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao gerar itemização: ' + err.message);
    }
  };

  // Função para copiar resultados
  const copyResults = () => {
    if (results.length === 0) {
      setError('Nenhum resultado para copiar.');
      return;
    }

    const textToCopy = results.map(r => r.newItem).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setSuccess('Resultados copiados para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar para a área de transferência.');
    });
  };

  // Função para copiar comparação
  const copyComparison = () => {
    if (results.length === 0) {
      setError('Nenhum resultado para copiar.');
      return;
    }

    const comparisonText = excelItemizer.current.generateComparisonText(results);
    navigator.clipboard.writeText(comparisonText).then(() => {
      setSuccess('Comparação copiada para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar comparação.');
    });
  };

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (results.length === 0) {
      setError('Nenhum resultado para exportar.');
      return;
    }

    const filename = `itemizacao_${new Date().toISOString().split('T')[0]}.xlsx`;
    const result = excelItemizer.current.exportToExcel(results, filename);
    
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  // Função para limpar tudo
  const clearAll = () => {
    setFile(null);
    setResults([]);
    setDescriptions([]);
    setDetectedColumns(null);
    setSelectedDescriptionColumn(null);
    setShowResults(false);
    setError('');
    setSuccess('');
    setMask('XXXX.XX.XX.XX.XX.XX');
    setStartNumber('1');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    excelItemizer.current.clear();
  };

  return (
    <div className="excel-upload-container">
      <div className="header">
        <h2>Itemização por Descrição - Upload de Excel</h2>
        <p>Carregue sua planilha Excel e gere itemização automática baseada nas descrições</p>
      </div>

      <div className="content">
        {/* Seção de Upload */}
        <div className="form-section">
          <h3>1. Upload da Planilha Excel</h3>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="button button-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Selecionar Arquivo Excel'}
            </button>
            {file && (
              <div className="file-info">
                <strong>Arquivo:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        </div>

        {/* Seção de Detecção de Colunas */}
        {detectedColumns && (
          <div className="form-section">
            <h3>2. Detecção de Colunas</h3>
            <div className="columns-info">
              <div className="detected-column">
                <strong>Coluna de Item:</strong> 
                {detectedColumns.item !== null ? ` Coluna ${String.fromCharCode(65 + detectedColumns.item)}` : ' Não detectada'}
              </div>
              <div className="detected-column">
                <strong>Coluna de Descrição:</strong> 
                {detectedColumns.description !== null ? ` Coluna ${String.fromCharCode(65 + detectedColumns.description)}` : ' Não detectada'}
              </div>
              <div className="detected-column">
                <strong>Outras Colunas:</strong> 
                {detectedColumns.other.length > 0 ? 
                  detectedColumns.other.map(col => ` ${String.fromCharCode(65 + col.index)}`).join(', ') : 
                  ' Nenhuma detectada'}
              </div>
            </div>
            
            {detectedColumns.description === null && (
              <div className="manual-selection">
                <label>Selecione manualmente a coluna de descrição:</label>
                <select 
                  value={selectedDescriptionColumn || ''} 
                  onChange={(e) => extractDescriptions(parseInt(e.target.value))}
                >
                  <option value="">Selecione uma coluna</option>
                  {detectedColumns.other.map(col => (
                    <option key={col.index} value={col.index}>
                      Coluna {String.fromCharCode(65 + col.index)}: {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Seção de Configuração */}
        {descriptions.length > 0 && (
          <div className="form-section">
            <h3>3. Configuração da Itemização</h3>
            <div className="config-grid">
              <div className="form-group">
                <label htmlFor="startNumber">
                  Número inicial da sequência:
                </label>
                <input
                  id="startNumber"
                  type="text"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  placeholder="Exemplo: 1 ou 0177"
                />
                <div className="help-text">
                  Número que iniciará a nova sequência (será formatado com zeros à esquerda)
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="mask">
                  Máscara de formatação (use X para números):
                </label>
                <input
                  id="mask"
                  type="text"
                  value={mask}
                  onChange={(e) => setMask(e.target.value)}
                  placeholder="Exemplo: XXXX.XX.XX.XX.XX.XX"
                />
                <div className="help-text">
                  💡 <strong>Dica:</strong> Deixe o número inicial vazio para usar apenas os níveis da máscara (sem XXXX)!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Resultados */}
        {showResults && (
          <div className="form-section">
            <h3>4. Resultados da Itemização</h3>
            <div className="results-summary">
              <strong>{results.length} itens processados</strong>
            </div>
            
            <div className="results-container">
              <div className="results-list">
                {results.slice(0, 20).map((result, index) => (
                  <div key={index} className="result-item">
                    <div className="result-number">{result.newItem}</div>
                    <div className="result-description">
                      {result.description.length > 80 ? 
                        result.description.substring(0, 80) + '...' : 
                        result.description}
                    </div>
                  </div>
                ))}
                {results.length > 20 && (
                  <div className="more-items">
                    ... e mais {results.length - 20} itens
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seção de Ações */}
        <div className="form-section">
          <h3>Ações</h3>
          <div className="actions-grid">
            {descriptions.length > 0 && (
              <button className="button" onClick={generateItemization}>
                Gerar Itemização
              </button>
            )}
            
            {results.length > 0 && (
              <>
                <button className="button button-success" onClick={copyResults}>
                  Copiar Nova Itemização
                </button>
                <button className="button button-info" onClick={copyComparison}>
                  Copiar Comparação
                </button>
                <button className="button button-warning" onClick={exportToExcel}>
                  Exportar para Excel
                </button>
              </>
            )}
            
            <button className="button button-secondary" onClick={clearAll}>
              Limpar Tudo
            </button>
          </div>
        </div>

        {/* Mensagens de Status */}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
};

export default ExcelUploadTab;

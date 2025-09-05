import * as XLSX from 'xlsx';

// Classe para itemização por descrição de planilhas Excel
export class ExcelItemizer {
  constructor() {
    this.workbook = null;
    this.worksheet = null;
    this.data = [];
    this.results = [];
  }

  // Método para processar arquivo Excel
  async processExcelFile(file) {
    try {
      // Ler o arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      this.workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const sheetName = this.workbook.SheetNames[0];
      this.worksheet = this.workbook.Sheets[sheetName];
      
      // Converter para JSON
      this.data = XLSX.utils.sheet_to_json(this.worksheet, { 
        header: 1, // Usar primeira linha como cabeçalho
        defval: '' // Valor padrão para células vazias
      });
      
      return {
        success: true,
        message: `Planilha carregada com sucesso! ${this.data.length} linhas encontradas.`,
        data: this.data
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao processar arquivo: ${error.message}`,
        data: []
      };
    }
  }

  // Método para detectar colunas automaticamente
  detectColumns() {
    if (this.data.length === 0) return null;

    const headers = this.data[0] || [];
    const detectedColumns = {
      item: null,
      description: null,
      unit: null,
      other: []
    };

    // Procurar por colunas conhecidas
    headers.forEach((header, index) => {
      const headerLower = header.toString().toLowerCase();
      
      if (headerLower.includes('item') || headerLower.includes('código')) {
        detectedColumns.item = index;
      } else if (headerLower.includes('descrição') || headerLower.includes('descricao') || 
                 headerLower.includes('atividade') || headerLower.includes('serviço')) {
        detectedColumns.description = index;
      } else if (headerLower.includes('unid') || headerLower.includes('unidade')) {
        detectedColumns.unit = index;
      } else {
        detectedColumns.other.push({ index, name: header });
      }
    });

    return detectedColumns;
  }

  // Método para extrair descrições da planilha
  extractDescriptions(descriptionColumnIndex = null) {
    if (this.data.length === 0) return [];

    const descriptions = [];
    
    // Se não especificou coluna, tentar detectar automaticamente
    if (descriptionColumnIndex === null) {
      const columns = this.detectColumns();
      descriptionColumnIndex = columns?.description || 1; // Padrão: coluna 1 (B)
    }

    // Extrair descrições (pular cabeçalho)
    for (let i = 1; i < this.data.length; i++) {
      const row = this.data[i];
      if (row && row[descriptionColumnIndex]) {
        const description = row[descriptionColumnIndex].toString().trim();
        if (description) {
          descriptions.push({
            row: i + 1, // Número da linha (1-indexed)
            description: description,
            originalItem: row[0] || '', // Item original se existir
            fullRow: row
          });
        }
      }
    }

    return descriptions;
  }

  // Método para gerar itemização baseada em descrições
  generateItemizationByDescription(descriptions, mask = 'XXXX.XX.XX.XX.XX.XX', startNumber = '1') {
    if (!descriptions || descriptions.length === 0) {
      return {
        success: false,
        message: 'Nenhuma descrição encontrada para itemizar.',
        results: []
      };
    }

    try {
      const results = [];
      const maskParts = mask.split('.');
      const startNumberPart = maskParts[0] || 'XXXX';
      const levelParts = maskParts.slice(1);
      
      // Se não há número inicial ou está vazio, usar modo sem número inicial
      const useStartNumber = startNumber && startNumber.trim() !== '';
      const actualStartNumber = useStartNumber ? startNumber : '';
      
      let currentLevel = 1;
      let levelCounters = {}; // Contador para cada nível
      
      descriptions.forEach((item, index) => {
        // Detectar nível baseado na descrição
        const detectedLevel = this.detectDescriptionLevel(item.description);
        
        // Ajustar contadores de nível
        if (detectedLevel <= currentLevel) {
          // Resetar contadores de níveis inferiores
          for (let level = detectedLevel; level <= currentLevel; level++) {
            levelCounters[level] = 1;
          }
        } else {
          // Expandir para novos níveis
          for (let level = currentLevel + 1; level <= detectedLevel; level++) {
            levelCounters[level] = 1;
          }
        }
        
        currentLevel = detectedLevel;
        
        // Incrementar contador do nível atual
        levelCounters[currentLevel] = (levelCounters[currentLevel] || 0) + 1;
        
        // Gerar número da itemização
        const sequenceParts = [];
        for (let level = 1; level <= currentLevel; level++) {
          const counter = levelCounters[level] || 1;
          sequenceParts.push(counter.toString().padStart(2, '0'));
        }
        
        // Completar com níveis da máscara se necessário
        while (sequenceParts.length < levelParts.length) {
          sequenceParts.push('01');
        }
        
        // Formatar número inicial
        const formattedStartNumber = useStartNumber ? 
          actualStartNumber.padStart(startNumberPart.length, '0') : '';
        
        // Gerar item final
        const newItem = useStartNumber ? 
          `${formattedStartNumber}.${sequenceParts.join('.')}` : 
          sequenceParts.join('.');
        
        results.push({
          row: item.row,
          originalItem: item.originalItem,
          description: item.description,
          newItem: newItem,
          level: currentLevel,
          fullRow: item.fullRow
        });
      });

      return {
        success: true,
        message: `Itemização gerada com sucesso! ${results.length} itens processados.`,
        results: results
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao gerar itemização: ${error.message}`,
        results: []
      };
    }
  }

  // Método para detectar nível hierárquico baseado na descrição
  detectDescriptionLevel(description) {
    const desc = description.toLowerCase();
    
    // Detectar padrões hierárquicos comuns
    if (desc.includes('gerenciamento') || desc.includes('administração') || 
        desc.includes('obra') || desc.includes('serviço')) {
      return 1; // Nível principal
    } else if (desc.includes('instalação') || desc.includes('mobilização') || 
               desc.includes('elaboração') || desc.includes('fornecimento')) {
      return 2; // Sub-nível
    } else if (desc.includes('canteiro') || desc.includes('documentação') || 
               desc.includes('engenharia') || desc.includes('preliminar')) {
      return 3; // Sub-sub-nível
    } else if (desc.includes('manutenção') || desc.includes('desmobilização') || 
               desc.includes('construção') || desc.includes('detalhada')) {
      return 4; // Sub-sub-sub-nível
    } else {
      return 5; // Nível mais específico
    }
  }

  // Método para exportar resultados para Excel
  exportToExcel(results, filename = 'itemizacao_resultado.xlsx') {
    try {
      // Preparar dados para exportação
      const exportData = [
        ['Linha', 'Item Original', 'Nova Itemização', 'Descrição', 'Nível']
      ];
      
      results.forEach(result => {
        exportData.push([
          result.row,
          result.originalItem,
          result.newItem,
          result.description,
          result.level
        ]);
      });
      
      // Criar nova planilha
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Itemização');
      
      // Baixar arquivo
      XLSX.writeFile(wb, filename);
      
      return {
        success: true,
        message: `Arquivo ${filename} exportado com sucesso!`
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao exportar: ${error.message}`
      };
    }
  }

  // Método para gerar texto de comparação
  generateComparisonText(results) {
    let comparisonText = 'Linha\tItem Original\tNova Itemização\tDescrição\n';
    comparisonText += '-----\t-------------\t----------------\t----------\n';
    
    results.forEach(result => {
      const description = result.description.length > 50 ? 
        result.description.substring(0, 50) + '...' : 
        result.description;
      
      comparisonText += `${result.row}\t${result.originalItem}\t${result.newItem}\t${description}\n`;
    });
    
    return comparisonText;
  }

  // Método para limpar dados
  clear() {
    this.workbook = null;
    this.worksheet = null;
    this.data = [];
    this.results = [];
  }
}

export default ExcelItemizer;

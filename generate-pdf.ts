import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function run() {
  const mdPath = path.join(process.cwd(), 'CONTEUDO_E_COPY.md');
  const pdfDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const pdfPath = path.join(pdfDir, 'CONTEUDO_E_COPY.pdf');

  console.log(`Lendo arquivo Markdown de: ${mdPath}`);
  const mdContent = fs.readFileSync(mdPath, 'utf-8');

  // Criar documento PDF A4 com margens de 50pt
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 60, left: 50, right: 50 },
    bufferPages: true // Necessário para calcular o número total de páginas dinamicamente
  });

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // CORES CORPORATIVAS (b.rocket / Emerald Slate Theme)
  const colors = {
    darkBg: '#09090b',     // zinc-950
    textDark: '#18181b',   // zinc-900
    textMuted: '#52525b',  // zinc-600
    emerald: '#10b981',    // emerald-500
    emeraldLight: '#ecfdf5', // emerald-50
    borderLight: '#e4e4e7', // zinc-200
    blockquoteBorder: '#10b981'
  };

  // --- 1. CAPA DO DOCUMENTO (ESTILO PREMIUM DARK) ---
  // Retângulo preto cobrindo a página inteira
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.darkBg);

  // Detalhe superior em esmeralda
  doc.rect(0, 0, doc.page.width, 15).fill(colors.emerald);

  // Logo b.rocket
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(36)
     .text('b.rocket', 50, 150);

  // Subtítulo técnico
  doc.fillColor(colors.emerald)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('// GEO_CORE_V10 // PIONEIROS EM OTIMIZAÇÃO PARA MOTORES GERATIVOS', 50, 200);

  // Linha divisória
  doc.strokeColor('rgba(255, 255, 255, 0.1)')
     .lineWidth(1)
     .moveTo(50, 230)
     .lineTo(doc.page.width - 50, 230)
     .stroke();

  // Título Principal do Conteúdo
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(24)
     .text('CONTEÚDO & COPY COMPLETO', 50, 280, { lineGap: 8 });

  doc.text('DO WEBSITE OFICIAL', 50, doc.y);

  // Descrição rápida
  doc.fillColor('#a1a1aa') // zinc-400
     .font('Helvetica')
     .fontSize(11)
     .text('Relatório estruturado de copy, termos técnicos, pacotes de investimento, metodologias científicas de Princeton e seções completas para revisão, auditoria de RAG e download off-line.', 50, 400, { width: doc.page.width - 100, lineGap: 6 });

  // Rodapé da capa
  doc.fillColor(colors.emerald)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('METODOLOGIA DE PRINCETON / OTIMIZAÇÃO DE RAG', 50, doc.page.height - 120);

  doc.fillColor('#a1a1aa')
     .font('Helvetica')
     .fontSize(9)
     .text('Gerado automaticamente para revisão corporativa em: ' + new Date().toLocaleDateString('pt-BR'), 50, doc.page.height - 100);

  doc.text('Suporte Técnico: workflows.berocket@gmail.com', 50, doc.page.height - 85);

  // --- FIM DA CAPA ---

  // Adicionar uma nova página para o conteúdo real
  doc.addPage();

  // Resetar cores para as páginas internas
  doc.fillColor(colors.textDark);

  // Processar o Markdown linha por linha
  const lines = mdContent.split('\n');
  let inBlockquote = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Pular a introdução e o cabeçalho técnico redundante já impresso na capa
    if (i < 3) continue; 

    // Pular linhas vazias mas dar um espaçamento
    if (line === '') {
      doc.moveDown(0.5);
      continue;
    }

    // Título # (H1) -> Forçar nova página para seções principais
    if (line.startsWith('# ')) {
      const titleText = line.replace('# ', '').trim();
      
      // Adicionar nova página antes de títulos principais (exceto se for o primeiro título após a capa)
      if (doc.y > 100) {
        doc.addPage();
      }

      doc.fillColor(colors.emerald)
         .font('Helvetica-Bold')
         .fontSize(18)
         .text(titleText, { lineGap: 10 });

      // Desenhar uma linha horizontal sob o título principal
      doc.strokeColor(colors.emerald)
         .lineWidth(1.5)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();

      doc.moveDown(1);
      doc.fillColor(colors.textDark);
      continue;
    }

    // Título ## (H2)
    if (line.startsWith('## ')) {
      const titleText = line.replace('## ', '').trim();
      
      // Se estiver muito próximo ao final da página, pular página
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.moveDown(1);
      doc.fillColor(colors.textDark)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text(titleText, { lineGap: 6 });
      doc.moveDown(0.4);
      continue;
    }

    // Título ### (H3)
    if (line.startsWith('### ')) {
      const titleText = line.replace('### ', '').trim();

      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      doc.moveDown(0.6);
      doc.fillColor(colors.textDark)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(titleText, { lineGap: 4 });
      doc.moveDown(0.2);
      continue;
    }

    // Título #### (H4)
    if (line.startsWith('#### ')) {
      const titleText = line.replace('#### ', '').trim();

      if (doc.y > doc.page.height - 60) {
        doc.addPage();
      }

      doc.moveDown(0.4);
      doc.fillColor(colors.emerald)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(titleText.toUpperCase(), { lineGap: 2 });
      doc.moveDown(0.1);
      continue;
    }

    // Blockquote (> )
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '').trim();
      doc.moveDown(0.4);
      
      const startX = doc.x;
      const startY = doc.y;

      // Renderizar o texto com recuo à esquerda e cor itálica
      doc.fillColor(colors.textMuted)
         .font('Helvetica-Oblique')
         .fontSize(10)
         .text(quoteText, startX + 15, startY, {
           width: doc.page.width - startX - 65,
           lineGap: 4
         });

      const endY = doc.y;

      // Desenhar barra lateral esmeralda para destacar a citação
      doc.strokeColor(colors.blockquoteBorder)
         .lineWidth(3)
         .moveTo(startX + 5, startY - 2)
         .lineTo(startX + 5, endY + 2)
         .stroke();

      doc.x = startX; // Resetar posição X para o padrão
      doc.moveDown(0.6);
      doc.fillColor(colors.textDark);
      continue;
    }

    // Itens de lista (- ou *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listText = line.replace(/^[-*]\s+/, '').trim();
      doc.moveDown(0.2);

      const startX = doc.x;
      const startY = doc.y;

      // Desenhar o marcador (bullet)
      doc.fillColor(colors.emerald)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('•', startX + 10, startY);

      // Limpar marcações de negrito inline no texto da lista
      const cleanText = listText.replace(/\*\*/g, '');

      // Desenhar o texto do item da lista
      doc.fillColor(colors.textDark)
         .font('Helvetica')
         .fontSize(10)
         .text(cleanText, startX + 22, startY, {
           width: doc.page.width - startX - 72,
           lineGap: 3
         });

      doc.x = startX; // Resetar X
      continue;
    }

    // Linha divisória (---)
    if (line === '---') {
      doc.moveDown(0.8);
      doc.strokeColor(colors.borderLight)
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();
      doc.moveDown(0.8);
      continue;
    }

    // Texto corrido (Parágrafo)
    // Limpar negrito simples do markdown (**texto**)
    const cleanParagraph = line.replace(/\*\*(.*?)\*\*/g, '$1');

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(colors.textDark)
       .text(cleanParagraph, {
         lineGap: 4,
         paragraphGap: 6,
         align: 'justify'
       });
  }

  // --- ADICIONAR CABEÇALHOS E RODAPÉS DE FORMA RETROATIVA ---
  const pages = doc.bufferedPageRange();
  for (let i = 1; i < pages.count; i++) { // Ignora a capa (página 0)
    doc.switchToPage(i);

    // Cabeçalho (Header)
    doc.fillColor(colors.textMuted)
       .font('Helvetica')
       .fontSize(8)
       .text('b.rocket // GEO_CORE_V10 // DOCUMENTO DE APOIO E COPY', 50, 30);

    doc.strokeColor(colors.borderLight)
       .lineWidth(0.5)
       .moveTo(50, 42)
       .lineTo(doc.page.width - 50, 42)
       .stroke();

    // Rodapé (Footer)
    doc.strokeColor(colors.borderLight)
       .lineWidth(0.5)
       .moveTo(50, doc.page.height - 45)
       .lineTo(doc.page.width - 50, doc.page.height - 45)
       .stroke();

    doc.fillColor(colors.textMuted)
       .font('Helvetica')
       .fontSize(8)
       .text('Este documento é confidencial e propriedade intelectual da b.rocket.', 50, doc.page.height - 35);

    const pageNumText = `Página ${i + 1} de ${pages.count}`;
    doc.text(pageNumText, doc.page.width - 50 - doc.widthOfString(pageNumText), doc.page.height - 35);
  }

  // Finalizar e salvar o documento
  doc.end();
  console.log(`Documento PDF salvo com sucesso em: ${pdfPath}`);
}

run();

const express = require('express');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.text({ type: '*/*' })); // Receber body raw XML como texto

// Função para extrair método do SOAP Action header
function extractMethodFromAction(action) {
  // Exemplo de action: 
  // http://www.hp.com/schemas/imaging/OXPd/service/statistics/2014/06/26/IStatisticsService/GetJobList
  if (!action) return null;
  const parts = action.split('/');
  return parts[parts.length - 1];
}

app.post('/hp/device/webservices/OXPd/StatisticsService', (req, res) => {
  const xml = req.body;
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  try {
    const jsonObj = parser.parse(xml);
    // Extrair Action no header: s:Envelope > s:Header > a:Action
    const action = jsonObj['s:Envelope']?.['s:Header']?.['a:Action'];

    const method = extractMethodFromAction(action);

    console.log(`Requisição método: ${method}`);

    if (!method) {
      return res.status(400).send('Método SOAP não identificado');
    }

    // Montar caminho do arquivo de resposta
    const responseFilePath = `./responses/${method}.xml`;

    if (!fs.existsSync(responseFilePath)) {
      return res.status(404).send(`Resposta para método ${method} não encontrada`);
    }

    // Ler o XML de resposta
    const responseXml = fs.readFileSync(responseFilePath, 'utf8');

    // Retornar XML no body
    res.type('application/soap+xml').send(responseXml);
  } catch (err) {
    console.error('Erro ao processar XML:', err);
    res.status(500).send('Erro interno do servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor OXPd mock rodando na porta ${port}`);
});

import puppeteer from 'puppeteer'



export async function getPixCode(payment_url) {
  let browser;
  try {
    // Inicializa o navegador
    browser = await puppeteer.launch({
      executablePath: '/opt/render/project/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
      headless: true, // Certifique-se de rodar no modo headless em produção
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], // Opções para ambientes como Docker
    });
    const page = await browser.newPage();

    // Navega até a url de pagamento
    await page.goto(payment_url, {
      waitUntil: 'networkidle2', // Aguarda o carregamento da página
      timeout: 60000, // Define um timeout (60 segundos)
    });
        // Aguarda o botão estar disponível e clica
        const buttonSelector = 'button[id=":R5ol6n6:"]';
        await page.waitForSelector(buttonSelector, { timeout: 10000 }); // Aguarda até 10 segundos pelo botão
        await page.click(buttonSelector);

       // Aguarda o campo do código Pix e captura o valor
       const inputSelector = 'input[id=":r0:"]';
       await page.waitForSelector(inputSelector, { timeout: 10000 });
       const code = await page.$eval(inputSelector, (el) => el.value);
      // Retorna o código Pix
      return code;
  } catch (error) {
    console.error('Erro no processo de extração do código Pix:', error.message);

    // Retorna um erro amigável para ser usado no bot
    throw new Error('Falha ao capturar o código Pix. Verifique se o link está válido ou tente novamente.');
  } finally {
    // Certifique-se de que o navegador será fechado mesmo em caso de erro
    if (browser) {
      await browser.close();
    }
  }
}

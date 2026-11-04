# Caderno Livre

Caderno de anotações à mão para iPad, celular e computador. Funciona no navegador, instala como app e funciona sem internet.

**Abrir:** https://bieloluiz.github.io/Caderno-Livre-/

## Instalar no iPad
1. Abra o endereço acima no **Safari**.
2. Toque em **Compartilhar** (o quadrado com a seta para cima).
3. Toque em **Adicionar à Tela de Início** e depois em **Adicionar**.

Os cadernos ficam guardados no próprio aparelho. Use o botão **Backup** de vez em quando e guarde o arquivo no app Arquivos ou no iCloud Drive.

## Escrever e estudar

- A esferográfica, a caneta fina e o marca-texto de fluxo cheio são exibidos como curvas vetoriais, durante e depois da escrita. O zoom não depende da resolução do canvas de fundo. Pincéis com textura preservam o motor de tinta e são renderizados em imagens individuais de alta resolução.
- Novos traços livres usam **perfect-freehand 1.2.3** para construir o contorno: espessura constante nas canetas uniformes e variação de pressão nos pincéis. A estabilização da captura continua no app, sem adicionar outro filtro de atraso. A mesma geometria é usada na prévia, no desenho salvo, na janela ampliada e na exportação. Traços anteriores preservam o motor original; formas, tracejados e marca-texto mantêm seu comportamento específico.
- **Páginas** no estojo abre miniaturas para navegar, duplicar, mover e apagar folhas.
- **Escrita ampliada** abre uma faixa para escrever maior na mesma folha. Toque na página para posicionar a região; as setas e **Próxima linha** deslocam a área.
- **Formas automáticas** no estojo: desenhe uma linha, um retângulo ou uma elipse e mantenha a ponta parada por um instante. O ajuste pode ser desfeito. O botão liga e desliga o recurso.
- **Importar PDF** na biblioteca cria um caderno; no menu do editor, acrescenta folhas. Os documentos viram fundos de página, preservando as proporções. A tinta continua editável. Limites: arquivo de até 40 MB, até 100 páginas e até 50 MB de imagens preparadas. PDFs protegidos por senha não são aceitos. O texto original do PDF não vira texto pesquisável.
- Nas opções do caderno, defina uma **pasta** e marque como **favorito**. A busca procura títulos, pastas e textos digitados; não reconhece a escrita à mão nem o texto de PDFs.

Os leitores e geradores de PDF ficam no próprio projeto e são preparados pelo cache offline. A disponibilidade offline depende de a primeira instalação do aplicativo terminar com conexão.

Ideias de organização e escrita inspiradas no [OwlLuna](https://github.com/owaisazmal/OwlLuna). Esta implementação usa APIs do navegador; não utiliza PencilKit e não promete o mesmo comportamento de um app nativo para iPad.

## Desenvolvimento e verificação

É um site estático: sirva a pasta com um servidor HTTP para testar o armazenamento e o modo offline. Não há etapa de compilação.

Para os testes de navegador, instale as dependências com `npm install`, prepare o Chromium com `npx playwright install chromium` e execute `npm test`. A variável `CHROMIUM_PATH` permite selecionar um navegador já instalado.

Os testes verificam edição, zoom, formas, janela ampliada, páginas, biblioteca, importação de PDF, salvamento, backup e uso offline. Apple Pencil, rejeição da palma e a aparência das bordas ainda precisam ser conferidos no Safari de um iPad real.

Dependências incluídas: [perfect-freehand 1.2.3](https://github.com/steveruizok/perfect-freehand), de Steve Ruiz (MIT, licença em `vendor/LICENSE-perfect-freehand.txt`); PDF.js 3.11.174 (Apache-2.0, licença em `vendor/LICENSE-pdfjs.txt`); e jsPDF 2.5.1 (MIT, aviso preservado no arquivo). O leitor de PDF funciona com avaliação dinâmica desativada. O arquivo do perfect-freehand é o bundle CommonJS distribuído no npm, envolvido em uma função que publica `window.PerfectFreehand`, com o aviso MIT preservado; não há dependência de CDN.


As canetas uniformes do motor perfect-freehand usam a linha central contínua com pontas arredondadas, evitando frestas no contorno de traços finos. Nessas canetas, fluxo baixo reduz a intensidade, sem perfurar a tinta. A correção também se aplica aos traços já salvos com perfect-freehand.

Correção de continuidade: esferográfica e caneta fina usam a curva contínua anterior, independentemente da marca do motor nos dados salvos. Fluxo muda a opacidade nessas canetas, sem apagar textura. Perfect Freehand permanece nas ferramentas de largura variável. O arquivo do motor tem URL versionada para atualizar o cache do navegador.

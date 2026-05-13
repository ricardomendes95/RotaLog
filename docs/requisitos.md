# Requisitos — App Rotas

## Visão Geral

Aplicativo mobile Android para monitorar trajetos de carro, funcionando como odômetro digital com rastreamento GPS em tempo real, métricas de velocidade/distância/tempo e exportação de relatório como imagem.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| RF-01 | O app exibe um mapa com a posição atual do usuário usando tiles OpenStreetMap (sem API key) |
| RF-02 | O usuário seleciona o tipo de transporte antes de iniciar o trajeto (carro, moto, bike, a pé) |
| RF-03 | O app inicia o rastreamento GPS ao pressionar o botão "Iniciar" |
| RF-04 | O app calcula a distância percorrida em km usando a Fórmula de Haversine sobre os pontos GPS coletados |
| RF-05 | O app exibe velocidade atual, média, máxima e mínima (velocidade mínima somente quando em movimento) |
| RF-06 | O app exibe tempo total e tempo líquido em movimento separadamente |
| RF-07 | O app descarta leituras GPS com precisão pior que 30 metros |
| RF-08 | O app descarta leituras abaixo de 0,5 km/h como ruído (veículo parado) |
| RF-09 | O app continua rastreando com o app em segundo plano (background location) |
| RF-10 | O app persiste o trajeto em andamento no banco local a cada leitura GPS para evitar perda de dados |
| RF-11 | O app finaliza e salva o trajeto ao pressionar o botão "Finalizar" |
| RF-12 | O app exibe o histórico de todos os trajetos salvos em ordem cronológica decrescente |
| RF-13 | O usuário pode visualizar o mapa completo do percurso de um trajeto passado |
| RF-14 | O usuário pode visualizar as métricas completas de um trajeto salvo (distância, tempos, velocidades) |
| RF-15 | O usuário pode exportar o relatório de um trajeto como imagem PNG e salvar na galeria do dispositivo |
| RF-16 | O usuário pode compartilhar a imagem do relatório via aplicativos do sistema (WhatsApp, e-mail, etc.) |
| RF-17 | O usuário pode excluir um trajeto do histórico |

---

## Requisitos Não-Funcionais

| ID | Categoria | Descrição |
|---|---|---|
| RNF-01 | Dados | Todos os dados são armazenados localmente via SQLite — sem backend, sem internet obrigatória para rastrear |
| RNF-02 | Disponibilidade | O app funciona completamente offline para rastreamento e consulta do histórico |
| RNF-03 | Performance | A interface permanece responsiva durante o rastreamento GPS ativo |
| RNF-04 | Bateria | O consumo de bateria é minimizado com intervalos de 2 segundos ou 5 metros entre leituras GPS |
| RNF-05 | Privacidade | O app solicita cada permissão com explicação antes de usá-la |
| RNF-06 | Manutenibilidade | O código segue TypeScript strict mode; cada serviço é independente e testável isoladamente |
| RNF-07 | Compatibilidade | O app funciona em Android 10 (API 29) ou superior |
| RNF-08 | Escalabilidade | O banco de dados suporta ao menos 1.000 trajetos e 500.000 coordenadas sem degradação perceptível |
| RNF-09 | Exportação | A captura e exportação do relatório como imagem não excede 3 segundos |
| RNF-10 | Mapa | Os tiles OSM (OpenStreetMap) são usados sem necessidade de API key ou token |

---

## Regras de Negócio

| ID | Regra |
|---|---|
| RN-01 | A velocidade mínima de cálculo de distância é 0,5 km/h — abaixo disso o ponto é ignorado para acumulação de km |
| RN-02 | O tempo líquido em movimento conta somente intervalos em que a velocidade está acima de 0,5 km/h |
| RN-03 | A velocidade média é calculada como: distância total / tempo líquido em movimento |
| RN-04 | A velocidade mínima registrada considera somente leituras em que o veículo está em movimento |
| RN-05 | Um trajeto só é considerado finalizado quando o usuário pressionar "Finalizar" explicitamente |
| RN-06 | A propriedade `speed` retornada pelo GPS está em m/s — converter para km/h multiplicando por 3,6 |
| RN-07 | Leituras GPS com acurácia pior que 30 metros são descartadas integralmente |

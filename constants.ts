
import { ChecklistCategory, Project } from './types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Portal Torres de Novara', location: 'São Paulo, SP' },
  { id: 'proj-2', name: 'Residencial Vista do Vale', location: 'Belo Horizonte, MG' },
  { id: 'proj-3', name: 'Condomínio Parque das Flores', location: 'Curitiba, PR' },
];

export const CHECKLIST_DEFINITIONS: ChecklistCategory[] = [
  {
    id: 'massa',
    title: 'Central de Decantação de Massa',
    subCategories: [
      {
        title: 'Lavagem de caminhão betoneira',
        items: [
          { id: 'massa-01', text: 'A Central de decantação de massa para lavagem de caminhão betoneira foi construída conforme projeto?' },
          { id: 'massa-02', text: 'Todas as lavagens de caminhão betoneira estão sendo realizadas na Central de decantação de massa? Há lavagem sendo realizada em local inapropriado?' },
          { id: 'massa-03', text: 'A Central de decantação de massa para lavagem de caminhão betoneira esta totalmente impermeabilizada? Toda efluente da lavagem esta sendo direcionado para as caixa de decantação?' },
          { id: 'massa-04', text: 'As caixas de decantação da Central de decantação de massa para lavagem de caminhão betoneira estão interligadas sem vazamento e impermeabilizadas?' },
          { id: 'massa-05', text: 'Na segunda caixa de decantação esta sendo utilizada brita para auxiliar o processo de filtragem?' },
          { id: 'massa-06', text: 'As caixas de decantação da Central de decantação de massa para lavagem de caminhão betoneira estão fechadas e sinalizadas?' },
          { id: 'massa-07', text: 'Esta sendo realizada análise do efluente gerado, após o tratamento pelas caixas de decantação? Sendo uma no início após implantação do sistema e outra após 6 (seis) meses?' },
          { id: 'massa-08', text: 'O resultado das análise estão dentro dos padrões estabelecidos? Se não, foi gerando plano de ação para adequação do sistema?' },
          { id: 'massa-09', text: 'O efluente gerado e dentro dos padrões estabelecidos, está sendo reaproveitado como meio de redução do consumo de água na obra?' },
        ],
      },
      {
        title: 'Central de Massa - Betoneira',
        items: [
          { id: 'massa-10', text: 'A Central de decantação de massa para Central de Betoneira foi construída conforme projeto?' },
          { id: 'massa-11', text: 'Todo concreto rodado por betoneira na obra estão sendo realizadas na Central de decantação de massa? Há concreto sendo rodado na obra em local inapropriado?' },
          { id: 'massa-12', text: 'A Central de decantação de massa para Central de Betoneira esta totalmente impermeabilizada? Toda efluente da lavagem esta sendo direcionado para as caixa de decantação?' },
          { id: 'massa-13', text: 'As caixas de decantação da Central de decantação de massa para Central de Betoneira estão interligadas sem vazamento e impermeabilizadas?' },
          { id: 'massa-14', text: 'Na segunda caixa de decantação esta sendo utilizada brita para auxiliar o processo de filtragem?' },
          { id: 'massa-15', text: 'As caixas de decantação da Central de decantação de massa para Central de Betoneira estão fechadas e sinalizadas?' },
          { id: 'massa-16', text: 'Esta sendo realizada análise do efluente gerado, após o tratamento pelas caixas de decantação? Sendo uma no início após implantação do sistema e outra após 6 (seis) meses?' },
          { id: 'massa-17', text: 'O resultado das análise estão dentro dos padrões estabelecidos? Se não, foi gerando plano de ação para adequação do sistema?' },
          { id: 'massa-18', text: 'O efluente gerado e dentro dos padrões estabelecidos, está sendo reaproveitado como meio de redução do consumo de água na obra?' },
        ],
      },
    ],
  },
  {
    id: 'efluentes',
    title: 'Efluentes Sanitários e Caixa Separadora',
    subCategories: [
      {
        title: 'Efluentes Sanitários',
        items: [
          { id: 'eflu-01', text: 'Os efluentes gerados no canteiro de obras são despejados diretamente nas redes de esgoto da localidade do obra com a devida autorização dos órgãos competentes?' },
          { id: 'eflu-02', text: 'Quando utilizado banheiros químicos nas frentes de serviço, são mantidos registros de limpeza dos banheiros químicos, bem como toda documentação da empresa que realiza a coleta e transporte dos resíduos?' },
          { id: 'eflu-03', text: 'Quando para tratamento de efluentes sanitários for utilizado sistema fossa-filtro é realizado o ensaio de análise química/biológica do efluente, após o tratamento, para verificar se os parâmetros definidos estão sendo atendidos?' },
          { id: 'eflu-04', text: 'Quando para tratamento de efluentes sanitários for utilizado sistema fossa séptica o efluente é recolhido através de um caminhão limpa-fossas e transportada para um destino adequado (devidamente licenciado)?' },
          { id: 'eflu-05', text: 'São mantidos registros de limpeza da fossa séptica, bem como toda documentação da empresa que realiza a coleta e transporte dos resíduos? (Licenças e MTR ou CTR)?' },
          { id: 'eflu-06', text: 'Há periodicidade de limpeza da fossa séptica para que não haja transbordos?' },
          { id: 'eflu-07', text: 'Os efluentes sanitários gerados são armazenados em reservatórios impermeabilizados fechados sem odores e sem conter vazamentos?' },
        ],
      },
      {
        title: 'Caixa Separadora Água e Óleo',
        items: [
          { id: 'eflu-09', text: 'O local de abastecimento de máquinas e equipamentos e locais de manutenções de máquinas são dotados de piso impermeável?' },
          { id: 'eflu-10', text: 'O local de abastecimento de máquinas e equipamentos e locais de manutenções de máquinas possuem caixa separadora água e óleo?' },
          { id: 'eflu-11', text: 'É realizada a limpeza do sistema separador de água e óleo, quando por inspeção visual, as caixas de decantação de sólidos estiverem cheias?' },
          { id: 'eflu-12', text: 'São mantidos registros de limpeza do separador de água e óleo, bem como toda documentação da empresa que realiza a coleta e transporte dos resíduos?' },
          { id: 'eflu-13', text: 'É realizada análise química do efluente, após o tratamento, para verificar se os parâmetros definidos estão sendo atendidos?' },
          { id: 'eflu-14', text: 'Quando houver volume de óleo significativo no sistema, ele é retirado, armazenado em tambor fechado e, posteriormente, destinado para refino.' },
          { id: 'eflu-15', text: 'A empresa que realiza destinado para refino esta devidamente licenciada?' },
          { id: 'eflu-16', text: 'O local de Armazenamento do óleo são adequados com bacia de contenção, ventilação, cobertura, identificação da área, acesso restrito?' },
          { id: 'eflu-17', text: 'O efluente gerado e dentro dos padrões estabelecidos, está sendo reaproveitado como meio de redução do consumo de água na obra?' },
        ],
      },
    ],
  },
  {
    id: 'campo',
    title: 'Inspeção de Campo',
    subCategories: [
      {
        title: 'Itens Verificáveis',
        items: [
          { id: 'campo-01', text: 'A separação de resíduos e o armazenamento temporário estão corretos nas baias? Sem misturas de resíduos?' },
          { id: 'campo-02', text: 'Areas internas dos blocos, corredores e apartamentos, estão limpas e organizadas? Sem restos de isopor, sacarias, papelão e entulhos?' },
          { id: 'campo-03', text: 'Todas as torres possuem suportes e bags para separação dos resíduos?' },
          { id: 'campo-04', text: 'O suporte e bags estão adequados sem estarem danificados?' },
          { id: 'campo-05', text: 'Central de Resíduos possui placas de identificação conforme cada resíduo a ser disposto?' },
          { id: 'campo-06', text: 'Há placas nos canteiro de obras, estimulando a coleta seletiva e limpeza do canteiro?' },
          { id: 'campo-07', text: 'Esta havendo recolhimento de resíduos nas baias evitando o acúmulo?' },
          { id: 'campo-08', text: 'As APPs estão delimitadas (sinalizadas), limpas e sem acesso? As placas indicativas de áreas verdes e APPs estão dispostas em local visível?' },
          { id: 'campo-09', text: 'As vias no entorno da obra estão limpas? Há limpeza periódica das vias em torno da obra?' },
          { id: 'campo-10', text: 'O Kit mitigação está sinalizado e disponível em local visível e de fácil acesso? Deve estar disposto na obra.' },
          { id: 'campo-11', text: 'Monitoramento de Fumaça Preta dos equipamentos e veículos estão realizados mensalmente?' },
          { id: 'campo-12', text: 'Há resíduos dispostos fora da sua respectiva baia na central de resíduos?' },
          { id: 'campo-13', text: 'Áreas externas, em volta dos blocos, estão limpas e organizadas?' },
          { id: 'campo-14', text: 'As Bandejas estão sendo limpas periodicamente?' },
          { id: 'campo-15', text: 'A obra possui dutos de entulho?' },
          { id: 'campo-16', text: 'A área destinada em frente da torre para receber o entulho do duto esta sinalizada e delimitada?' },
        ],
      },
    ],
  },
  {
    id: 'quimicos',
    title: 'Produtos Químicos',
    subCategories: [
      {
        title: 'Itens Verificáveis',
        items: [
          { id: 'quim-01', text: 'Há condições adequadas de armazenamento de produtos químicos (bacia de contenção, ventilação, cobertura, identificação da área, acesso restrito)?' },
          { id: 'quim-02', text: 'A área é impermeabilizada para armazenamento de produtos químicos?' },
          { id: 'quim-03', text: 'Há esvaziamento de restos das latas de tintas ou tambores antes do seu descarte?' },
          { id: 'quim-04', text: 'Há Kit de emergência ambiental na proximidades em caso de derramamento/vazamentos com produtos químicos?' },
          { id: 'quim-05', text: 'As Fichas de Segurança do Produto Químico (FISPQ) estão disponibilizadas nos locais que contenham os produtos químicos?' },
          { id: 'quim-06', text: 'A utilização de produtos químicos está sendo realizada em piso impermeabilizado?' },
          { id: 'quim-07', text: 'Os funcionários que manipulam produtos químicos foram treinados quanto aos riscos que estão expostos?' },
          { id: 'quim-08', text: 'O local para armazenamento foi construído, preferencialmente, em material incombustível (ex.: alvenaria, metal etc.).' },
          { id: 'quim-09', text: 'A área de estocagem esta devidamente sinalizada?' },
          { id: 'quim-10', text: 'Há sistemas de contenções de vazamentos sob motores de máquinas estacionárias? Bacias de contenção compressores etc.' },
        ],
      },
    ],
  },
  {
    id: 'combustivel',
    title: 'Tanque de Combustível',
    subCategories: [
      {
        title: 'Itens Verificáveis',
        items: [
          { id: 'comb-01', text: 'A área de abastecimento de veículos possui piso impermeabilizado?' },
          { id: 'comb-02', text: 'O dique de contenção do tanque de abastecimento de veículos está ligado a uma caixa separadora de água e óleo?' },
          { id: 'comb-03', text: 'A área de abastecimento de veículos possui canaleta de contenção ligada à caixa separadora de água e óleo?' },
          { id: 'comb-04', text: 'O tanque de combustível possui Laudo de estanqueidade atestando sua boa condição física estrutural?' },
          { id: 'comb-05', text: 'O tanque possui bacia de contenção?' },
          { id: 'comb-06', text: 'A bacia de contenção possui capacidade de armazenamento de 10% a mais que o volume total do tanque?' },
          { id: 'comb-07', text: 'O tanque está sobre base impermeável e em boas condições?' },
          { id: 'comb-08', text: 'A área de abastecimento possui acesso restrito?' },
          { id: 'comb-09', text: 'A bomba possui bloqueio de acionamento por pessoas não autorizadas?' },
          { id: 'comb-10', text: 'O tanque possui indicador de nível de combustível?' },
          { id: 'comb-11', text: 'O sistema de filtragem de combustível está instalado no interior da bacia de contenção?' },
          { id: 'comb-12', text: 'É respeitado o raio de 7,5 m a partir da bomba de abastecimento de isolamento?' },
          { id: 'comb-13', text: 'Esta sendo realizada análise do efluente gerado? Sendo uma no início após implantação do sistema e outra após 6 (seis) meses?' },
          { id: 'comb-14', text: 'O resultado das análise estão dentro dos padrões estabelecidos? Se não, foi gerando plano de ação para adequação do sistema?' },
        ],
      },
    ],
  },
];

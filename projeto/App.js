import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
  Keyboard,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Provider as PaperProvider,
  TextInput,
  Card,
  Text,
} from 'react-native-paper';

const CHAVE = '@tarefas_app';

export default function App() {
  const [tarefas, setTarefas] = useState([]);
  const [input, setInput] = useState('');
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('todas');

  useEffect(() => {
    buscarSalvas();
  }, []);

  async function buscarSalvas() {
    let dados = await AsyncStorage.getItem(CHAVE);
    if (dados != null) {
      setTarefas(JSON.parse(dados));
    }
  }

  async function gravar(arr) {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(arr));
  }

  function add() {
    if (input == '') {
      Alert.alert('Ops!', 'Escreve alguma coisa primeiro.');
      return;
    }

    let agora = new Date();
    let dia = agora.toLocaleDateString('pt-BR');
    let hr = agora.getHours() + ':' + String(agora.getMinutes()).padStart(2, '0');

    let nova = {
      id: String(Date.now()),
      texto: input,
      feita: false,
      quando: dia + ' ' + hr,
    };

    let arr = [nova, ...tarefas];
    setTarefas(arr);
    gravar(arr);
    setInput('');
    Keyboard.dismiss();
  }

  function check(id) {
    let arr = tarefas.map((t) => {
      if (t.id == id) {
        return { ...t, feita: !t.feita };
      }
      return t;
    });
    setTarefas(arr);
    gravar(arr);
  }

  function del(id) {
    let apagar = () => {
      let arr = tarefas.filter((t) => t.id != id);
      setTarefas(arr);
      gravar(arr);
    };

    if (Platform.OS == 'web') {
      if (confirm('Apagar?')) apagar();
    } else {
      Alert.alert('Apagar', 'Tem certeza?', [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: apagar },
      ]);
    }
  }

  function limparFeitas() {
    Alert.alert('Limpar', 'Remover todas as notas feitas?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim', onPress: () => {
          let arr = tarefas.filter((t) => !t.feita);
          setTarefas(arr);
          gravar(arr);
        }
      },
    ]);
  }

  let lista = [];
  for (let i = 0; i < tarefas.length; i++) {
    let t = tarefas[i];
    if (aba == 'feitas' && !t.feita) continue;
    if (busca != '' && !t.texto.toLowerCase().includes(busca.toLowerCase())) continue;
    lista.push(t);
  }

  let qtdFeitas = 0;
  for (let i = 0; i < tarefas.length; i++) {
    if (tarefas[i].feita) qtdFeitas++;
  }

  let pendentes = tarefas.length - qtdFeitas;

  return (
    <PaperProvider>
      <View style={styles.tela}>

        <View style={styles.header}>
          <Image source={require('./fury.png')} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Bloco de Notas</Text>
            <Text style={styles.sub}>{qtdFeitas} de {tarefas.length} feitas</Text>
          </View>
        </View>

        <View style={{ height: 3, backgroundColor: '#1f1f1f' }}>
          {tarefas.length > 0 &&
            <View style={{ height: 3, backgroundColor: '#fff', width: (qtdFeitas / tarefas.length * 100) + '%' }} />
          }
        </View>

        <View style={styles.inputArea}>
          <TextInput
            mode="outlined"
            label="Nova nota..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={add}
            returnKeyType="done"
            style={styles.input}
            theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#666', background: '#1a1a1a' } }}
          />
        </View>

        <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
          <TextInput
            mode="flat"
            placeholder="Pesquisar..."
            value={busca}
            onChangeText={setBusca}
            style={{ backgroundColor: '#1a1a1a', fontSize: 13, height: 42 }}
            theme={{ colors: { primary: '#fff', text: '#fff', background: '#1a1a1a' } }}
          />
        </View>

        <View style={styles.abas}>
          <TouchableOpacity
            style={[styles.aba, aba == 'todas' && styles.abaAtiva]}
            onPress={() => setAba('todas')}
          >
            <Text style={[styles.abaTexto, aba == 'todas' && { color: '#000' }]}>
              Todas ({tarefas.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aba, aba == 'feitas' && styles.abaAtiva]}
            onPress={() => setAba('feitas')}
          >
            <Text style={[styles.abaTexto, aba == 'feitas' && { color: '#000' }]}>
              Feitas ({qtdFeitas})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 38, marginBottom: 10 }}></Text>
              <Text style={{ color: '#444', fontSize: 14 }}>
                {busca != '' ? 'Nada encontrado.' : 'Sem notas ainda.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={[styles.card, item.feita && { opacity: 0.4 }]}>
              <Card.Content style={styles.linha}>

                <TouchableOpacity
                  style={[styles.check, item.feita && styles.checkOn]}
                  onPress={() => check(item.id)}
                >
                  {item.feita &&
                    <Text style={{ color: '#000', fontSize: 13, fontWeight: 'bold' }}></Text>
                  }
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.textoNota, item.feita && styles.riscado]}
                    onPress={() => check(item.id)}
                    numberOfLines={2}
                  >
                    {item.texto}
                  </Text>
                  <Text style={styles.quando}>{item.quando}</Text>
                </View>

                <TouchableOpacity style={styles.btnDel} onPress={() => del(item.id)}>
                  <Text style={styles.btnDelTxt}></Text>
                </TouchableOpacity>

              </Card.Content>
            </Card>
          )}
        />

        <View style={styles.rodape}>
          <View style={styles.rodapeInfo}>
            <Text style={styles.rodapeNum}>{pendentes}</Text>
            <Text style={styles.rodapeTxt}>pendentes</Text>
          </View>
          <View style={styles.rodapeDivisor} />
          <View style={styles.rodapeInfo}>
            <Text style={styles.rodapeNum}>{qtdFeitas}</Text>
            <Text style={styles.rodapeTxt}>concluídas</Text>
          </View>
          <View style={styles.rodapeDivisor} />
          <TouchableOpacity style={styles.rodapeInfo} onPress={limparFeitas}>
            <Text style={styles.rodapeNum}>—</Text>
            <Text style={styles.rodapeTxt}>limpar feitas</Text>
          </TouchableOpacity>
        </View>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  titulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sub: {
    color: '#555',
    fontSize: 11,
  },
  inputArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a1a',
    fontSize: 14,
  },
  abas: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 3,
  },
  aba: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  abaAtiva: {
    backgroundColor: '#fff',
  },
  abaTexto: {
    color: '#555',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lista: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  card: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    elevation: 0,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkOn: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  textoNota: {
    color: '#fff',
    fontSize: 15,
  },
  riscado: {
    textDecorationLine: 'line-through',
    color: '#444',
  },
  quando: {
    color: '#444',
    fontSize: 10,
    marginTop: 3,
  },
  btnDel: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnDelTxt: {
    color: '#555',
    fontSize: 15,
  },
  rodape: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  rodapeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  rodapeNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rodapeTxt: {
    color: '#555',
    fontSize: 10,
    marginTop: 1,
  },
  rodapeDivisor: {
    width: 1,
    height: 30,
    backgroundColor: '#2a2a2a',
  },
});
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { Platform, Alert } from 'react-native';
import { useRoute, useNavigation,  } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

import { 
  Container, 
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  Content,
  ProviderListContariner,
  ProviderList, 
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePickerButton,
  OpenDatePickerButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  CreateAppointmentbutton,
  CreateAppointmentButtonText
 } from './styles';

interface RouteParams {
  providerId: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

export interface AvailabilityItem {
  hour: number;
  available: boolean;
}

const AppointmentCreated: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute();
  const { goBack, navigate } = useNavigation();

  const routeParams = route.params as RouteParams;
  
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setselectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(routeParams.providerId);

  useEffect(() => {
    api.get('providers').then(response => {
      setProviders(response.data)
    })

  }, []);
  
  useEffect(() => {
    api.get(`providers/${selectedProvider}/day-availability`, {
      params: {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
      }
    }).then(response => {
      setAvailability(response.data);
    })
  }, [selectedDate, selectedProvider])

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker(state => !state);
  }, []);

  const handleDateChanged = useCallback(
    (event: any, date: Date | undefined) => {

      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }

      if (date) {
        setselectedDate(date);
      }
    }, []);
    
  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate);

      date.setHours(selectedHour);
      date.setMinutes(0);
      // selectedDate.setHours(selectedHour);
      // selectedDate.setMinutes(0);

      await api.post('appointments', {
        provider_id: selectedProvider,
        date,
      });

      navigate('AppointmentCreated', { date: date.getTime() })

    } catch (error) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar o agendamento, tente novamente'
      )
    }
  }, [navigate, selectedDate, selectedHour, selectedHour]);

  const morningAvailability = useMemo(() => {
    return availability
      .filter(({hour }) => hour < 12 )
      .map(({ hour, available }) => {
        return {
          hour, 
          available, 
          hourFormatted: format(new Date().setHours(hour), "HH:00")
        }
      })
  }, [availability]);

  const afternonAvailability = useMemo(() => {
    return availability
      .filter(({hour }) => hour >= 12 )
      .map(({ hour, available }) => {
        return {
          hour, 
          available, 
          hourFormatted: format(new Date().setHours(hour), "HH:00")
        }
      })
  }, [availability]);


  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999592" />
        </BackButton>

        <HeaderTitle>Cabeleireiro</HeaderTitle>

        <UserAvatar source={{ uri: user.avatar_url }} />
      </Header>

      <Content>
        <ProviderListContariner>
          <ProviderList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={provider => provider.id}
            renderItem={({ item: provider}) => (
              <ProviderContainer 
                onPress={() => handleSelectProvider(provider.id)} 
                selected={provider.id === selectedProvider}
              >
                <ProviderAvatar source={{ uri: provider.avatar_url }}/>
                <ProviderName selected={provider.id === selectedProvider}>{provider.name}</ProviderName>
              </ProviderContainer>
            )} 
          />
        </ProviderListContariner>

        <Calendar>
          <Title>Escolha a data</Title>
            
          <OpenDatePickerButton onPress={handleToggleDatePicker}>
            <OpenDatePickerButtonText>Selecionar outra data</OpenDatePickerButtonText>
          </OpenDatePickerButton>

          {showDatePicker && (
            <DateTimePicker 
              mode="date"
              display="calendar"
              onChange={handleDateChanged}
              textColor="#f4ede8"
              value={selectedDate}
            />
          )}
        </Calendar>

        <Schedule>
          <Title>Escolha o horário</Title>

          <Section>
            <SectionTitle>Manhã</SectionTitle>

            <SectionContent>
            {morningAvailability.map(({ hourFormatted, available, hour }) => (
              <Hour 
                enabled={available}
                selected={ selectedHour === hour}
                available={available} 
                key={hourFormatted}
                onPress={() => handleSelectHour(hour)}
              >
                <HourText selected={ selectedHour === hour}>{hourFormatted}</HourText>
              </Hour>
            ))}
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>Tarde</SectionTitle>

            <SectionContent>
              {afternonAvailability.map(({ hourFormatted , available}, hour) => (
                <Hour 
                  enabled={available}
                  selected={ selectedHour === hour}
                  available={available} 
                  key={hourFormatted}
                  onPress={() => handleSelectHour(hour)}
                >
                  <HourText selected={ selectedHour === hour}>{hourFormatted}</HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>
        </Schedule>

        <CreateAppointmentbutton onPress={handleCreateAppointment}>
            <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
        </CreateAppointmentbutton>

      </Content>
    </Container>
  );
};

export default AppointmentCreated;

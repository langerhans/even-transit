import { useState, useEffect } from 'react';
import type { Place } from './config';
import { searchStation } from './motis';
import { renderHome } from './pages/home';
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Text,
  IconButton,
  TrashIcon,
  NavigateIcon,
} from '@jappyjan/even-realities-ui';

interface SavedConnection {
  id: string;
  from: Place;
  to: Place;
}

const STORAGE_KEY = 'even_transport_connections';

interface AppProps {
  bridge: EvenAppBridge;
}

export default function App({ bridge }: AppProps) {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [fromResults, setFromResults] = useState<Place[]>([]);
  const [toResults, setToResults] = useState<Place[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<Place | null>(null);
  const [selectedTo, setSelectedTo] = useState<Place | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const json = await bridge.getLocalStorage(STORAGE_KEY);
        if (json) {
          setConnections(JSON.parse(json));
        }
      } catch (e) {
        console.error('Failed to load connections', e);
      }
    }
    load();
  }, [bridge]);

  const saveConnections = async (newConns: SavedConnection[]) => {
    setConnections(newConns);
    try {
      await bridge.setLocalStorage(STORAGE_KEY, JSON.stringify(newConns));
      await renderHome(bridge, false, newConns);
    } catch (e) {
      console.error('Failed to save connections', e);
    }
  };

  const handleSearch = async (query: string, setResults: (p: Place[]) => void) => {
    if (query.length < 3) return;
    const res = await searchStation(query);
    setResults(res);
  };

  const addConnection = async () => {
    if (!selectedFrom || !selectedTo) return;
    const newConn: SavedConnection = {
      id: Date.now().toString(),
      from: selectedFrom,
      to: selectedTo,
    };
    const updated = [...connections, newConn];
    await saveConnections(updated);
    setFromSearch('');
    setToSearch('');
    setSelectedFrom(null);
    setSelectedTo(null);
    setFromResults([]);
    setToResults([]);
  };

  const deleteConnection = async (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    await saveConnections(updated);
  };

  return (
    <div className="py-6 px-3">
      <Text as="h1" variant="title-xl" className="mb-4">
        Connections
      </Text>

      {/* Saved Connections */}
      <div className="flex flex-col gap-2 mb-6">
        {connections.length === 0 && (
          <Text variant="body-2" className="text-tc-2 py-4">No saved connections.</Text>
        )}
        {connections.map(conn => (
          <Card key={conn.id} className="w-full">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <NavigateIcon size={20} className="text-tc-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Text variant="title-2" className="block truncate">{conn.from.name}</Text>
                  <Text variant="detail" className="text-tc-2 block truncate">to {conn.to.name}</Text>
                </div>
              </div>
              <IconButton
                variant="negative"
                size="sm"
                onClick={() => deleteConnection(conn.id)}
                aria-label="Delete connection"
              >
                <TrashIcon size={16} />
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Connection */}
      <Card className="w-full">
        <CardHeader>
          <Text variant="title-1">Add Connection</Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* From */}
          <div className="relative">
            <Text as="label" variant="subtitle" className="block mb-1">From</Text>
            <Input
              className="w-full"
              value={fromSearch}
              onChange={(e) => {
                setFromSearch(e.target.value);
                setSelectedFrom(null);
                handleSearch(e.target.value, setFromResults);
              }}
              placeholder="Search start station..."
            />
            {fromSearch && !selectedFrom && fromResults.length > 0 && (
              <Card className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto z-10">
                {fromResults.map(p => (
                  <div
                    key={p.id}
                    className="px-4 py-2.5 cursor-pointer hover:bg-bc-2 active:bg-bc-3 transition"
                    onClick={() => {
                      setSelectedFrom(p);
                      setFromSearch(p.name);
                      setFromResults([]);
                    }}
                  >
                    <Text variant="body-2">{p.name}</Text>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* To */}
          <div className="relative">
            <Text as="label" variant="subtitle" className="block mb-1">To</Text>
            <Input
              className="w-full"
              value={toSearch}
              onChange={(e) => {
                setToSearch(e.target.value);
                setSelectedTo(null);
                handleSearch(e.target.value, setToResults);
              }}
              placeholder="Search destination..."
            />
            {toSearch && !selectedTo && toResults.length > 0 && (
              <Card className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto z-10">
                {toResults.map(p => (
                  <div
                    key={p.id}
                    className="px-4 py-2.5 cursor-pointer hover:bg-bc-2 active:bg-bc-3 transition"
                    onClick={() => {
                      setSelectedTo(p);
                      setToSearch(p.name);
                      setToResults([]);
                    }}
                  >
                    <Text variant="body-2">{p.name}</Text>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="primary"
            className="w-full"
            onClick={addConnection}
            disabled={!selectedFrom || !selectedTo}
          >
            Save Connection
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
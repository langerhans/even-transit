import { useState, useEffect } from 'react';
import type { Place } from './config';
import { searchStation } from './motis';
import { renderHome } from './pages/home';
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';
import { Button } from 'even-toolkit/web/button';
import { Card } from 'even-toolkit/web/card';
import { Input } from 'even-toolkit/web/input';
import { ListItem } from 'even-toolkit/web/list-item';
import { ScreenHeader } from 'even-toolkit/web/screen-header';
import { SectionHeader } from 'even-toolkit/web/section-header';
import { EmptyState } from 'even-toolkit/web/empty-state';
import { IcNavDirection } from 'even-toolkit/web/icons/svg-icons';

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
      <ScreenHeader title="Connections" />

      {/* Saved Connections */}
      <div className="flex flex-col gap-2 mb-6">
        {connections.length === 0 ? (
          <EmptyState
            icon={<IcNavDirection width={32} height={32} />}
            title="No saved connections"
            description="Add a connection below to get started."
          />
        ) : (
          connections.map(conn => (
            <ListItem
              key={conn.id}
              title={conn.from.name}
              subtitle={`to ${conn.to.name}`}
              leading={<IcNavDirection width={20} height={20} />}
              onDelete={() => deleteConnection(conn.id)}
            />
          ))
        )}
      </div>

      {/* Add New Connection */}
      <Card padding="lg">
        <SectionHeader title="Add Connection" />
        <div className="flex flex-col gap-4 mt-3">
          {/* From */}
          <div className="relative">
            <label className="block mb-1 text-[13px] font-medium">From</label>
            <Input
              value={fromSearch}
              onChange={(e) => {
                setFromSearch(e.target.value);
                setSelectedFrom(null);
                handleSearch(e.target.value, setFromResults);
              }}
              placeholder="Search start station..."
            />
            {fromSearch && !selectedFrom && fromResults.length > 0 && (
              <Card className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto z-10" padding="none">
                {fromResults.map(p => (
                  <ListItem
                    key={p.id}
                    title={p.name}
                    onPress={() => {
                      setSelectedFrom(p);
                      setFromSearch(p.name);
                      setFromResults([]);
                    }}
                  />
                ))}
              </Card>
            )}
          </div>

          {/* To */}
          <div className="relative">
            <label className="block mb-1 text-[13px] font-medium">To</label>
            <Input
              value={toSearch}
              onChange={(e) => {
                setToSearch(e.target.value);
                setSelectedTo(null);
                handleSearch(e.target.value, setToResults);
              }}
              placeholder="Search destination..."
            />
            {toSearch && !selectedTo && toResults.length > 0 && (
              <Card className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto z-10" padding="none">
                {toResults.map(p => (
                  <ListItem
                    key={p.id}
                    title={p.name}
                    onPress={() => {
                      setSelectedTo(p);
                      setToSearch(p.name);
                      setToResults([]);
                    }}
                  />
                ))}
              </Card>
            )}
          </div>
        </div>

        <Button
          variant="highlight"
          className="w-full mt-4"
          onClick={addConnection}
          disabled={!selectedFrom || !selectedTo}
        >
          Save Connection
        </Button>
      </Card>
    </div>
  );
}